import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, copyFileSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { AiToolId, AiModel } from '../types.js';
import { API_BASE_URL, DEFAULT_ENDPOINTS, TOOLS } from '../types.js';
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

/**
 * If a file exists at `filePath`, copy it to the backup directory
 * with a timestamp. Returns the backup path or null.
 */
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
  label: string;   // human-readable (e.g. "2026-05-29 22:30")
  dir: string;
}

/** List all available backups, optionally filtered by tool */
export function listBackups(toolId?: AiToolId): BackupEntry[] {
  const results: BackupEntry[] = [];

  if (!existsSync(BACKUP_ROOT)) return results;

  if (toolId) {
    return listBackupsForTool(toolId);
  }

  for (const tool of TOOLS) {
    results.push(...listBackupsForTool(tool.id));
  }

  // Sort newest first
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
    results.push({
      toolId,
      timestamp: entry.name,
      files,
      label: ts,
      dir: backupDir,
    });
  }

  return results;
}

/** Restore a specific backup by tool and timestamp */
export function restoreBackup(toolId: AiToolId, timestamp: string): boolean {
  const backupDir = join(getBackupDir(toolId), timestamp);
  if (!existsSync(backupDir)) return false;

  const files = readdirSync(backupDir).filter((f) => f !== '.gitkeep');

  for (const file of files) {
    const source = join(backupDir, file);
    // Determine the original path from the tool config paths
    const paths = getToolConfigPaths(toolId);
    const match = paths.find((p) => {
      const name = p.split(/[/\\]/).pop();
      return name === file;
    });

    if (match) {
      // Ensure parent dir exists
      const parentDir = match.split(/[/\\]/).slice(0, -1).join(/[/\\]/.test(match) ? '/' : '\\');
      if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });
      copyFileSync(source, match);
    }
  }

  return true;
}

/** Get the backup directory root path for display */
export function getBackupRoot(): string {
  return BACKUP_ROOT;
}

// ─── API Key Validation ───────────────────────────────────────

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const url = `${API_BASE_URL}/models`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
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
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
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

/**
 * Generate configuration for a tool, **backing up any existing config first**.
 */
export function configureTool(
  toolId: AiToolId,
  selectedModels: string[] = []
): boolean {
  const apiKey = getApiKey();
  if (!apiKey) return false;

  try {
    switch (toolId) {
      case 'claude-code':
        return configureClaudeCode(apiKey, selectedModels);
      case 'cursor':
        return configureCursor(apiKey, selectedModels);
      case 'continue':
        return configureContinue(apiKey, selectedModels);
      case 'github-copilot':
        return configureGithubCopilot(apiKey, selectedModels);
      case 'opencode':
        return configureOpenCode(apiKey, selectedModels);
      case 'crush':
        return configureCrush(apiKey, selectedModels);
      case 'factory-droid':
        return configureFactoryDroid(apiKey, selectedModels);
      default:
        return false;
    }
  } catch {
    return false;
  }
}

function buildModelEntries(
  apiKey: string,
  selectedModels: string[]
): { title: string; provider: string; model: string; apiBase: string; apiKey: string; contextLength?: number }[] {
  const models = selectedModels.length > 0 ? selectedModels : ['claude-sonnet-4-20250514', 'deepseek-chat'];

  return models.map((modelId) => ({
    title: `${modelId} (CIC)`,
    provider: 'openai',
    model: modelId,
    apiBase: API_BASE_URL,
    apiKey,
    contextLength: modelId.includes('claude') ? 200_000 : 64_000,
  }));
}

function configureClaudeCode(apiKey: string, selectedModels: string[]): boolean {
  const home = homedir();
  const configDir = join(home, '.claude');
  const configFile = join(configDir, 'settings.json');

  // Backup existing settings.json before overwriting
  backupIfExists('claude-code', configFile);

  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });

  // Read existing settings to preserve non-env keys
  let existing: Record<string, unknown> = {};
  if (existsSync(configFile)) {
    try {
      existing = JSON.parse(readFileSync(configFile, 'utf-8'));
    } catch {
      existing = {};
    }
  }

  // Determine model value — deepseek-v4-pro gets a routing suffix
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

function configureCursor(apiKey: string, selectedModels: string[]): boolean {
  const home = homedir();
  const cursorDir = join(home, '.cursor');
  const configFile = join(cursorDir, 'cic-config.json');

  // Backup existing before overwriting
  backupIfExists('cursor', configFile);

  if (!existsSync(cursorDir)) mkdirSync(cursorDir, { recursive: true });

  const cursorConfig = {
    openAiBaseUrl: API_BASE_URL,
    openAiApiKey: apiKey,
    chatCompletionsEndpoint: DEFAULT_ENDPOINTS.chatCompletions,
    embeddingsEndpoint: DEFAULT_ENDPOINTS.embeddings,
    models: buildModelEntries(apiKey, selectedModels),
  };

  writeFileSync(configFile, JSON.stringify(cursorConfig, null, 2), 'utf-8');
  return true;
}

function configureContinue(apiKey: string, selectedModels: string[]): boolean {
  const home = homedir();
  const continueDir = join(home, '.continue');
  const configFile = join(continueDir, 'cic-config.json');

  // Backup existing before overwriting
  backupIfExists('continue', configFile);

  if (!existsSync(continueDir)) mkdirSync(continueDir, { recursive: true });

  const models = buildModelEntries(apiKey, selectedModels);
  models.push({
    title: 'Embeddings (CIC)',
    provider: 'openai',
    model: 'text-embedding-3-small',
    apiBase: API_BASE_URL,
    apiKey,
  });

  const continueConfig = {
    models,
    tabAutocompleteModel: models.length > 0 ? { ...models[0] } : null,
    embeddingsProvider: {
      provider: 'openai',
      model: 'text-embedding-3-small',
      apiBase: API_BASE_URL,
      apiKey,
    },
  };

  writeFileSync(configFile, JSON.stringify(continueConfig, null, 2), 'utf-8');
  return true;
}

function configureGithubCopilot(apiKey: string, _selectedModels: string[]): boolean {
  const home = homedir();
  const copilotDir = join(home, '.config', 'github-copilot');
  const configFile = join(copilotDir, 'cic-hosts.json');

  // Backup existing before overwriting
  backupIfExists('github-copilot', configFile);

  if (!existsSync(copilotDir)) mkdirSync(copilotDir, { recursive: true });

  const hostsConfig = {
    'github.com': {
      user: 'cic-user',
      oauth_token: apiKey,
      base_url: API_BASE_URL,
    },
  };

  writeFileSync(configFile, JSON.stringify(hostsConfig, null, 2), 'utf-8');
  return true;
}

// ─── OpenCode ───────────────────────────────────────────────

function configureOpenCode(apiKey: string, selectedModels: string[]): boolean {
  const home = homedir();
  const configDir = join(home, '.config', 'opencode');
  const configFile = join(configDir, 'config.json');
  const envFile = join(configDir, '.env');

  backupIfExists('opencode', configFile);
  backupIfExists('opencode', envFile);

  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });

  // OpenCode supports a JSON config with provider settings
  const openCodeConfig = {
    provider: 'openai',
    apiKey,
    baseUrl: API_BASE_URL,
    models: selectedModels.length > 0 ? selectedModels : undefined,
  };
  writeFileSync(configFile, JSON.stringify(openCodeConfig, null, 2), 'utf-8');

  // Also write .env for CLI usage
  const envContent = `# CIC AI Config Helper - OpenCode Configuration
OPENAI_API_KEY="${apiKey}"
OPENAI_BASE_URL="${API_BASE_URL}"
`;
  writeFileSync(envFile, envContent, 'utf-8');

  return true;
}

// ─── Crush ───────────────────────────────────────────────────

function configureCrush(apiKey: string, selectedModels: string[]): boolean {
  const home = homedir();
  const configDir = join(home, '.config', 'crush');
  const configFile = join(configDir, 'config.json');
  const envFile = join(home, '.crush.env');

  backupIfExists('crush', configFile);
  backupIfExists('crush', envFile);

  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });

  // Crush uses OpenAI-compatible config
  const crushConfig = {
    provider: {
      name: 'openai',
      apiKey,
      baseUrl: API_BASE_URL,
      defaultModel: selectedModels[0] || 'claude-sonnet-4-20250514',
    },
    models: buildModelEntries(apiKey, selectedModels),
  };
  writeFileSync(configFile, JSON.stringify(crushConfig, null, 2), 'utf-8');

  // Env file for terminal use
  const envContent = `# CIC AI Config Helper - Crush Configuration
OPENAI_API_KEY="${apiKey}"
OPENAI_BASE_URL="${API_BASE_URL}"
CRUSH_DEFAULT_MODEL="${selectedModels[0] || 'claude-sonnet-4-20250514'}"
`;
  writeFileSync(envFile, envContent, 'utf-8');

  return true;
}

// ─── Factory Droid ──────────────────────────────────────────

function configureFactoryDroid(apiKey: string, selectedModels: string[]): boolean {
  const home = homedir();
  const configDir = join(home, '.config', 'factory', 'droid');
  const configFile = join(configDir, 'config.json');
  const envFile = join(home, '.droid.env');

  backupIfExists('factory-droid', configFile);
  backupIfExists('factory-droid', envFile);

  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });

  // Factory Droid uses OpenAI-compatible endpoints
  const droidConfig = {
    provider: 'openai',
    apiKey,
    baseUrl: API_BASE_URL,
    models: selectedModels.length > 0
      ? selectedModels.map((m) => ({
          id: m,
          provider: 'openai',
          apiBase: API_BASE_URL,
          apiKey,
        }))
      : [
          {
            id: 'claude-sonnet-4-20250514',
            provider: 'openai',
            apiBase: API_BASE_URL,
            apiKey,
          },
        ],
  };
  writeFileSync(configFile, JSON.stringify(droidConfig, null, 2), 'utf-8');

  // Env file for terminal use
  const envContent = `# CIC AI Config Helper - Factory Droid Configuration
OPENAI_API_KEY="${apiKey}"
OPENAI_BASE_URL="${API_BASE_URL}"
FACTORY_API_KEY="${apiKey}"
FACTORY_API_BASE="${API_BASE_URL}"
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
      case 'cursor':
        execSync('where cursor 2>nul', { stdio: 'ignore' });
        return true;
      case 'opencode':
        execSync('where opencode 2>nul || where open-code 2>nul', { stdio: 'ignore' });
        return true;
      case 'crush':
        execSync('where crush 2>nul', { stdio: 'ignore' });
        return true;
      case 'factory-droid':
        execSync('where droid 2>nul', { stdio: 'ignore' });
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
      case 'cursor':
        execSync('where cursor 2>nul', { stdio: 'ignore' });
        return true;
      case 'continue':
        execSync('where code 2>nul', { stdio: 'ignore' });
        return true;
      case 'github-copilot':
        execSync('where code 2>nul || where idea 2>nul', { stdio: 'ignore' });
        return true;
      case 'opencode':
        execSync('where opencode 2>nul || where open-code 2>nul', { stdio: 'ignore' });
        return true;
      case 'crush':
        execSync('where crush 2>nul', { stdio: 'ignore' });
        return true;
      case 'factory-droid':
        execSync('where droid 2>nul', { stdio: 'ignore' });
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
    case 'cursor':
      return [join(home, '.cursor', 'cic-config.json')];
    case 'continue':
      return [join(home, '.continue', 'cic-config.json')];
    case 'github-copilot':
      return [join(home, '.config', 'github-copilot', 'cic-hosts.json')];
    case 'opencode':
      return [
        join(home, '.config', 'opencode', 'config.json'),
        join(home, '.config', 'opencode', '.env'),
      ];
    case 'crush':
      return [
        join(home, '.config', 'crush', 'config.json'),
        join(home, '.crush.env'),
      ];
    case 'factory-droid':
      return [
        join(home, '.config', 'factory', 'droid', 'config.json'),
        join(home, '.droid.env'),
      ];
    default:
      return [];
  }
}
