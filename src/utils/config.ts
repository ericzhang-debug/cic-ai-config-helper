import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import type { AppConfig, Language } from '../types.js';

const CONFIG_DIR = join(homedir(), '.config', 'cic-ai-config-helper');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: AppConfig = {
  language: 'zh_CN',
  apiKey: null,
  configuredTools: {},
  selectedModels: [],
  lastUpdated: null,
};

function ensureDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function readConfig(): AppConfig {
  try {
    if (existsSync(CONFIG_PATH)) {
      const raw = readFileSync(CONFIG_PATH, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // ignore parse errors, return defaults
  }
  return { ...DEFAULT_CONFIG };
}

function writeConfig(config: AppConfig): void {
  ensureDir();
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export function getConfig(): AppConfig {
  return readConfig();
}

export function setConfig(partial: Partial<AppConfig>): void {
  const current = readConfig();
  writeConfig({ ...current, ...partial });
}

export function getLanguage(): Language {
  return readConfig().language ?? 'zh_CN';
}

export function setLanguage(lang: Language): void {
  const config = readConfig();
  config.language = lang;
  writeConfig(config);
}

export function getApiKey(): string | null {
  return readConfig().apiKey ?? null;
}

export function setApiKey(key: string): void {
  const config = readConfig();
  config.apiKey = key;
  config.lastUpdated = new Date().toISOString();
  writeConfig(config);
}

export function deleteApiKey(): void {
  const config = readConfig();
  config.apiKey = null;
  writeConfig(config);
}

export function isToolConfigured(toolId: string): boolean {
  const config = readConfig();
  return (config.configuredTools as Record<string, boolean>)[toolId] === true;
}

export function setToolConfigured(toolId: string, configured: boolean): void {
  const config = readConfig();
  (config.configuredTools as Record<string, boolean>)[toolId] = configured;
  writeConfig(config);
}

export function getSelectedModels(): string[] {
  return readConfig().selectedModels ?? [];
}

export function setSelectedModels(models: string[]): void {
  const config = readConfig();
  config.selectedModels = models;
  writeConfig(config);
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}
