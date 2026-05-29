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
export type AiToolId = 'claude-code' | 'cursor' | 'continue' | 'github-copilot' | 'opencode' | 'crush' | 'factory-droid';

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
    id: 'cursor',
    name: 'Cursor',
    nameZh: 'Cursor',
    configPaths: [],
    description: 'AI-first code editor',
    descriptionZh: 'AI 优先的代码编辑器',
    icon: '📝',
  },
  {
    id: 'continue',
    name: 'Continue.dev',
    nameZh: 'Continue.dev',
    configPaths: [],
    description: 'Open-source AI code assistant plugin',
    descriptionZh: '开源 AI 代码助手插件',
    icon: '🔌',
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    nameZh: 'GitHub Copilot',
    configPaths: [],
    description: 'GitHub official AI pair programmer',
    descriptionZh: 'GitHub 官方 AI 结对编程工具',
    icon: '👾',
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
  {
    id: 'crush',
    name: 'Crush',
    nameZh: 'Crush',
    configPaths: [],
    description: 'Terminal-native AI coding agent (tuurlijk)',
    descriptionZh: '终端原生 AI 编码代理 (tuurlijk)',
    icon: '💥',
  },
  {
    id: 'factory-droid',
    name: 'Factory Droid',
    nameZh: 'Factory Droid',
    configPaths: [],
    description: 'AI coding agent by Factory',
    descriptionZh: 'Factory 出品的 AI 编码代理',
    icon: '🏭',
  },
];
