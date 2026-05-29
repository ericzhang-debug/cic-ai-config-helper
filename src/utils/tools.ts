import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, copyFileSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { AiToolId, AiModel } from '../types.js';
import { API_BASE_URL, TOOLS } from '../types.js';
import { getApiKey } from './config.js';

// ─── Backup Directory ─────────────────────────────────────────

const BACKUP_ROOT = join(homedir(), '.config', 'cic-ai-config-helper', 'backups');

function getBackupDir(toolId: AiToolId): string {
  return join(BACKUP_ROOT, toolId);
}

function ensureBackupDir(toolId: AiToolId): string {
  const dir = getBackupDir(toolId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export function backupIfExists(toolId: AiToolId, filePath: string): string | null {
  if (!existsSync(filePath)) return null;

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = join(ensureBackupDir(toolId), ts);
  mkdirSync(backupDir, { recursive: true });

  const name = filePath.split(/[/\\]/).pop() || 'config';
  const dest = join(backupDir, name);
  copyFileSync(filePath, dest);
  return dest;
}

// ─── Public Backup / Restore API ──────────────────────────────

export interface BackupEntry {
  toolId: AiToolId;
  timestamp: string;
  files: string[];
  label: string;
  dir: string;
}

export function listBackups(toolId?: AiToolId): BackupEntry[] {
  const results: BackupEntry[] = [];
  if (!existsSync(BACKUP_ROOT)) return results;

  if (toolId) return listBackupsForTool(toolId);

  for (const tool of TOOLS) {
    results.push(...listBackupsForTool(tool.id));
  }
  results.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return results;
}

function listBackupsForTool(toolId: AiToolId): BackupEntry[] {
  const dir = getBackupDir(toolId);
  if (!existsSync(dir)) return [];

  const entries = readdirSync(dir, { withFileTypes: true });
  const results: BackupEntry[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const backupDir = join(dir, entry.name);
    const files = readdirSync(backupDir).filter((f) => f !== '.gitkeep');
    if (files.length === 0) continue;

    const ts = entry.name.replace(/-/g, ':').replace(/T/, ' ').replace(/\.\d+Z$/, '');
    results.push({ toolId, timestamp: entry.name, files, label: ts, dir: backupDir });
  }
  return results;
}

export function restoreBackup(toolId: AiToolId, timestamp: string): boolean {
  const backupDir = join(getBackupDir(toolId), timestamp);
  if (!existsSync(backupDir)) return false;

  const files = readdirSync(backupDir).filter((f) => f !== '.gitkeep');

  for (const file of files) {
    const source = join(backupDir, file);
    const paths = getToolConfigPaths(toolId);
    const match = paths.find((p) => p.split(/[/\\]/).pop() === file);
    if (match) {
      const parentDir = match.split(/[/\\]/).slice(0, -1).join(/[/\\]/.test(match) ? '/' : '\\');
      if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });
      copyFileSync(source, match);
    }
  }
  return true;
}

export function getBackupRoot(): string {
  return BACKUP_ROOT;
}

// ─── API Key Validation ───────────────────────────────────────

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const url = `${API_BASE_URL}/models`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Model Fetching ───────────────────────────────────────────

export async function fetchModels(apiKey: string): Promise<AiModel[]> {
  try {
    const url = `${API_BASE_URL}/models`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: AiModel[] };
    return body.data ?? [];
  } catch {
    return [];
  }
}

// ─── Tool Configuration ───────────────────────────────────────

export function configureTool(toolId: AiToolId, selectedModels: string[] = []): boolean {
  const apiKey = getApiKey();
  if (!apiKey) return false;

  try {
    switch (toolId) {
      case 'claude-code':
        return configureClaudeCode(apiKey, selectedModels);
      case 'opencode':
        return configureOpenCode(apiKey, selectedModels);
      default:
        return false;
    }
  } catch {
    return false;
  }
}

function configureClaudeCode(apiKey: string, selectedModels: string[]): boolean {
  const home = homedir();
  const configDir = join(home, '.claude');
  const configFile = join(configDir, 'settings.json');

  backupIfExists('claude-code', configFile);
  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });

  let existing: Record<string, unknown> = {};
  if (existsSync(configFile)) {
    try { existing = JSON.parse(readFileSync(configFile, 'utf-8')); } catch { existing = {}; }
  }

  const model = selectedModels.length > 0 ? selectedModels[0] : 'claude-sonnet-4-20250514';
  const modelValue = model === 'deepseek-v4-pro' ? 'deepseek-v4-pro[1m]' : model;

  existing.env = {
    ANTHROPIC_AUTH_TOKEN: apiKey,
    ANTHROPIC_BASE_URL: 'https://ai.ecustcic.com/api',
    ANTHROPIC_MODEL: modelValue,
    ANTHROPIC_DEFAULT_OPUS_MODEL: modelValue,
    ANTHROPIC_DEFAULT_SONNET_MODEL: modelValue,
    ANTHROPIC_DEFAULT_HAIKU_MODEL: modelValue,
    CLAUDE_CODE_SUBAGENT_MODEL: modelValue,
    CLAUDE_CODE_EFFORT_LEVEL: 'max',
    API_TIMEOUT_MS: '3000000',
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
  };

  writeFileSync(configFile, JSON.stringify(existing, null, 2), 'utf-8');
  return true;
}

function configureOpenCode(apiKey: string, selectedModels: string[]): boolean {
  const home = homedir();
  const configDir = join(home, '.config', 'opencode');
  const configFile = join(configDir, 'config.json');
  const envFile = join(configDir, '.env');

  backupIfExists('opencode', configFile);
  backupIfExists('opencode', envFile);
  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });

  const openCodeConfig = {
    provider: 'openai',
    apiKey,
    baseUrl: API_BASE_URL,
    models: selectedModels.length > 0 ? selectedModels : undefined,
  };
  writeFileSync(configFile, JSON.stringify(openCodeConfig, null, 2), 'utf-8');

  const envContent = `# CIC AI Config Helper - OpenCode Configuration
OPENAI_API_KEY="${apiKey}"
OPENAI_BASE_URL="${API_BASE_URL}"
`;
  writeFileSync(envFile, envContent, 'utf-8');
  return true;
}

// ─── Tool Launch & Availability ────────────────────────────────

export function launchTool(toolId: AiToolId): boolean {
  try {
    switch (toolId) {
      case 'claude-code':
        execSync('where claude 2>nul || where claude-code 2>nul', { stdio: 'ignore' });
        return true;
      case 'opencode':
        execSync('where opencode 2>nul || where open-code 2>nul', { stdio: 'ignore' });
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export function isToolAvailable(toolId: AiToolId): boolean {
  try {
    switch (toolId) {
      case 'claude-code':
        execSync('where claude 2>nul || where claude-code 2>nul', { stdio: 'ignore' });
        return true;
      case 'opencode':
        execSync('where opencode 2>nul || where open-code 2>nul', { stdio: 'ignore' });
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export function getToolConfigPaths(toolId: AiToolId): string[] {
  const home = homedir();
  switch (toolId) {
    case 'claude-code':
      return [join(home, '.claude', 'settings.json')];
    case 'opencode':
      return [join(home, '.config', 'opencode', 'config.json'), join(home, '.config', 'opencode', '.env')];
    default:
      return [];
  }
}
