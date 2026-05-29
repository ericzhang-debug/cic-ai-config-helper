/** Supported interface languages */
export type Language = 'zh_CN' | 'en_US';

/** API endpoint definitions */
export interface ApiEndpoints {
  chatCompletions: string;
  ollamaChat: string;
  responses: string;
  claudeMessages: string;
  embeddings: string;
}

/** Supported AI coding tools */
export type AiToolId = 'claude-code' | 'opencode';

/** Tool configuration profile */
export interface ToolProfile {
  id: AiToolId;
  name: string;
  nameZh: string;
  configPaths: string[];
  description: string;
  descriptionZh: string;
  icon: string;
}

/** Model from /v1/models endpoint (OpenAI spec) */
export interface AiModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

/** Stored configuration schema */
export interface AppConfig {
  language: Language;
  apiKey: string | null;
  configuredTools: Partial<Record<AiToolId, boolean>>;
  selectedModels: string[];
  lastUpdated: string | null;
}

export const API_BASE_URL = 'https://ai.ecustcic.com/api/v1';

export const DEFAULT_ENDPOINTS: ApiEndpoints = {
  chatCompletions: `${API_BASE_URL}/chat/completions`,
  ollamaChat: 'https://ai.ecustcic.com/api/ollama/api/chat',
  responses: `${API_BASE_URL}/responses`,
  claudeMessages: `${API_BASE_URL}/messages`,
  embeddings: `${API_BASE_URL}/embeddings`,
};

export const TOOLS: ToolProfile[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    nameZh: 'Claude Code',
    configPaths: [],
    description: 'Anthropic official CLI coding agent',
    descriptionZh: 'Anthropic 官方 CLI 编程代理',
    icon: '🤖',
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    nameZh: 'OpenCode',
    configPaths: [],
    description: 'Open-source AI coding assistant (SST)',
    descriptionZh: '开源 AI 编码助手 (SST)',
    icon: '📂',
  },
];
