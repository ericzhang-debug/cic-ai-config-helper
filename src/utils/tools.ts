import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, copyFileSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { AiToolId, AiModel } from '../types.js';
import { API_BASE_URL, TOOLS } from '../types.js';
import { getApiKey } from './config.js';

// ─── Backup Directory ─────────────────────────────────────────

const BACKUP_ROOT = join(homedir(), '.config', 'cic-ai-config-helper', 'backups');
const ANTHROPIC_API_BASE_URL = API_BASE_URL.replace(/\/v1$/, '');

const TOOL_COMMANDS: Record<AiToolId, string[]> = {
  'claude-code': ['claude', 'claude-code'],
  opencode: ['opencode', 'open-code'],
  openclaw: ['openclaw'],
  deepcode: ['deepcode'],
  workbuddy: ['codebuddy'],
  codebuddy: ['codebuddy'],
  codex: ['codex'],
  hermes: ['hermes'],
};

function isCommandAvailable(command: string): boolean {
  try {
    const lookup = process.platform === 'win32' ? 'where' : 'command -v';
    execSync(`${lookup} ${command}`, { stdio: 'ignore', shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh' });
    return true;
  } catch {
    return false;
  }
}

function getBackupDir(toolId: AiToolId): string {
  return join(BACKUP_ROOT, toolId);
}

function ensureBackupDir(toolId: AiToolId): string {
  const dir = getBackupDir(toolId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export function backupIfExists(toolId: AiToolId, filePath: string, timestamp = createBackupTimestamp()): string | null {
  if (!existsSync(filePath)) return null;

  const ts = timestamp;
  const backupDir = join(ensureBackupDir(toolId), ts);
  mkdirSync(backupDir, { recursive: true });

  const name = filePath.split(/[/\\]/).pop() || 'config';
  const dest = join(backupDir, name);
  copyFileSync(filePath, dest);
  return dest;
}

function createBackupTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function backupToolFiles(toolId: AiToolId, filePaths: string[]): void {
  const timestamp = createBackupTimestamp();
  for (const filePath of filePaths) backupIfExists(toolId, filePath, timestamp);
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
      case 'openclaw':
        return configureOpenClaw(apiKey, selectedModels);
      case 'deepcode':
        return configureDeepCode(apiKey, selectedModels);
      case 'codex':
        return configureCodex(apiKey, selectedModels);
      case 'hermes':
        return configureHermes(apiKey, selectedModels);
      case 'workbuddy':
      case 'codebuddy':
        return configureCodeBuddy(toolId, apiKey, selectedModels);
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

  backupToolFiles('claude-code', [configFile]);
  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });

  let existing: Record<string, unknown> = {};
  if (existsSync(configFile)) {
    try { existing = JSON.parse(readFileSync(configFile, 'utf-8')); } catch { existing = {}; }
  }

  const model = selectedModels.length > 0 ? selectedModels[0] : 'claude-sonnet-4-20250514';
  const modelValue = model === 'deepseek-v4-pro' ? 'deepseek-v4-pro[1m]' : model;

  existing.env = {
    ...(isRecord(existing.env) ? existing.env : {}),
    ANTHROPIC_AUTH_TOKEN: apiKey,
    ANTHROPIC_BASE_URL: ANTHROPIC_API_BASE_URL,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function configureOpenCode(apiKey: string, selectedModels: string[]): boolean {
  const home = homedir();
  const configDir = join(home, '.config', 'opencode');
  const configFile = join(configDir, 'opencode.json');
  const envFile = join(configDir, '.env');

  backupToolFiles('opencode', [configFile, envFile]);
  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });

  // Single model entry (model selection is single-select)
  const modelId = selectedModels.length > 0 ? selectedModels[0] : 'claude-sonnet-4-20250514';

  const openCodeConfig = {
    $schema: 'https://opencode.ai/config.json',
    provider: {
      deepseek: {
        npm: '@ai-sdk/openai-compatible',
        options: {
          baseURL: API_BASE_URL,
          apiKey,
          setCacheKey: true,
        },
        models: {
          [modelId]: { name: modelId },
        },
      },
    },
  };
  writeFileSync(configFile, JSON.stringify(openCodeConfig, null, 2), 'utf-8');

  const envContent = `# CIC AI Config Helper - OpenCode Configuration
OPENAI_API_KEY="${apiKey}"
OPENAI_BASE_URL="${API_BASE_URL}"
`;
  writeFileSync(envFile, envContent, 'utf-8');
  return true;
}

// ─── OpenClaw ────────────────────────────────────────────────

function configureOpenClaw(apiKey: string, selectedModels: string[]): boolean {
  const home = homedir();
  const configDir = join(home, '.openclaw');
  const configFile = join(configDir, 'openclaw.json');

  backupToolFiles('openclaw', [configFile]);
  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });

  const modelId = selectedModels.length > 0 ? selectedModels[0] : 'claude-sonnet-4-20250514';

  const config = {
    agents: {
      defaults: {
        models: {
          [modelId]: { alias: modelId },
        },
        model: {
          primary: modelId,
        },
      },
    },
    tools: {
      profile: 'coding',
    },
    models: {
      mode: 'merge',
      providers: {
        'custom-api-bocha-cn': {
          baseUrl: ANTHROPIC_API_BASE_URL,
          api: 'anthropic-messages',
          apiKey,
          models: [
            {
              id: modelId,
              name: modelId,
              api: 'anthropic-messages',
              baseUrl: ANTHROPIC_API_BASE_URL,
              reasoning: false,
              input: ['text'],
              cost: {
                input: 0,
                output: 0,
                cacheRead: 0,
                cacheWrite: 0,
              },
              contextWindow: 1_000_000,
              maxTokens: 384_000,
            },
          ],
        },
      },
    },
  };

  writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
  return true;
}

// ─── CodeBuddy ──────────────────────────────────────────────

function configureCodeBuddy(toolId: 'workbuddy' | 'codebuddy', apiKey: string, selectedModels: string[]): boolean {
  const home = homedir();
  const configDir = join(home, '.codebuddy');
  const configFile = join(configDir, 'models.json');

  backupToolFiles(toolId, [configFile]);
  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });

  const modelId = selectedModels.length > 0 ? selectedModels[0] : 'claude-sonnet-4-20250514';

  const config = {
    models: [
      {
        id: modelId,
        name: modelId,
        vendor: 'ECUST-CIC',
        url: `${API_BASE_URL}/chat/completions`,
        apiKey,
        maxInputTokens: 128_000,
        maxOutputTokens: 8_192,
        supportsToolCall: true,
        supportsImages: false,
        relatedModels: {
          lite: modelId,
          reasoning: modelId,
        },
      },
    ],
    availableModels: [modelId],
  };

  writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
  return true;
}

// ─── Deep Code ──────────────────────────────────────────────

function configureDeepCode(apiKey: string, selectedModels: string[]): boolean {
  const home = homedir();
  const configDir = join(home, '.deepcode');
  const configFile = join(configDir, 'settings.json');

  backupToolFiles('deepcode', [configFile]);
  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });

  const modelId = selectedModels.length > 0 ? selectedModels[0] : 'claude-sonnet-4-20250514';

  const config = {
    env: {
      MODEL: modelId,
      BASE_URL: ANTHROPIC_API_BASE_URL,
      API_KEY: apiKey,
    },
    thinkingEnabled: true,
    reasoningEffort: 'max',
  };

  writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
  return true;
}

// ─── Codex & Hermes ──────────────────────────────────────────

function configureCodex(apiKey: string, selectedModels: string[]): boolean {
  const configDir = join(homedir(), '.codex');
  const configFile = join(configDir, 'config.toml');
  const modelsFile = join(configDir, 'models.json');
  backupToolFiles('codex', [configFile, modelsFile]);
  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });

  const modelId = selectedModels[0] ?? 'deepseek-v4-pro';
  const catalogPath = modelsFile.replace(/\\/g, '/');
  let existing = existsSync(configFile) ? readFileSync(configFile, 'utf-8') : '';
  existing = existing.replace(/^(model|model_provider|preferred_auth_method|forced_login_method|model_reasoning_effort|web_search|model_catalog_json)\s*=.*\r?\n/gm, '');
  existing = existing.replace(/^\[model_providers\.cic\][\s\S]*?(?=^\[|(?![\s\S]))/m, '');
  existing = existing.trimEnd();
  const managed = [
    `model = ${JSON.stringify(modelId)}`,
    'model_provider = "cic"',
    'preferred_auth_method = "apikey"',
    'forced_login_method = "api"',
    'model_reasoning_effort = "high"',
    'web_search = "disabled"',
    `model_catalog_json = ${JSON.stringify(catalogPath)}`,
    '', '[model_providers.cic]', 'name = "CIC AI"',
    `base_url = ${JSON.stringify(API_BASE_URL)}`,
    'wire_api = "responses"',
    `experimental_bearer_token = ${JSON.stringify(apiKey)}`,
  ].join('\n');
  writeFileSync(configFile, `${existing}${existing ? '\n\n' : ''}${managed}\n`, 'utf-8');
  const models = [...new Set(selectedModels.length ? selectedModels : [modelId])].map((id) => ({ slug: id, display_name: id, description: 'CIC AI model', context_window: 1_000_000, max_context_window: 1_000_000, max_output_tokens: 8_192, supports_parallel_tool_calls: true, supported_in_api: true, visibility: 'list' }));
  writeFileSync(modelsFile, JSON.stringify({ models }, null, 2), 'utf-8');
  return true;
}

function configureHermes(apiKey: string, selectedModels: string[]): boolean {
  const configDir = join(homedir(), '.hermes');
  const configFile = join(configDir, 'config.yaml');
  backupToolFiles('hermes', [configFile]);
  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });
  const modelId = selectedModels[0] ?? 'deepseek-v4-pro';
  let existing = existsSync(configFile) ? readFileSync(configFile, 'utf-8') : '';
  existing = existing.replace(/^model:\r?\n(?:^[ \t].*\r?\n?)*/m, '').trimEnd();
  const managed = ['model:', `  default: ${JSON.stringify(modelId)}`, '  provider: custom', `  base_url: ${JSON.stringify(API_BASE_URL)}`, `  api_key: ${JSON.stringify(apiKey)}`, '  api_mode: chat_completions'].join('\n');
  writeFileSync(configFile, `${existing}${existing ? '\n\n' : ''}${managed}\n`, 'utf-8');
  return true;
}
// ─── Tool Launch & Availability ────────────────────────────────

export function launchTool(toolId: AiToolId): boolean {
  for (const command of TOOL_COMMANDS[toolId]) {
    if (!isCommandAvailable(command)) continue;
    try {
      const child = spawn(command, [], { detached: true, stdio: 'ignore', shell: process.platform === 'win32' });
      child.unref();
      return true;
    } catch {
      // Try an alternative command name when a tool offers one.
    }
  }
  return false;
}

export function isToolAvailable(toolId: AiToolId): boolean {
  return TOOL_COMMANDS[toolId].some(isCommandAvailable);
}

export function getToolConfigPaths(toolId: AiToolId): string[] {
  const home = homedir();
  switch (toolId) {
    case 'claude-code':
      return [join(home, '.claude', 'settings.json')];
    case 'opencode':
      return [join(home, '.config', 'opencode', 'opencode.json'), join(home, '.config', 'opencode', '.env')];
    case 'openclaw':
      return [join(home, '.openclaw', 'openclaw.json')];
    case 'deepcode':
      return [join(home, '.deepcode', 'settings.json')];
    case 'workbuddy':
    case 'codebuddy':
      return [join(home, '.codebuddy', 'models.json')];
    case 'codex':
      return [join(home, '.codex', 'config.toml'), join(home, '.codex', 'models.json')];
    case 'hermes':
      return [join(home, '.hermes', 'config.yaml')];
    default:
      return [];
  }
}
