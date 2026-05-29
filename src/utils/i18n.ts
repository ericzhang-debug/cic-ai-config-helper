import type { Language } from '../types.js';

type TranslationValue = string | ((...args: string[]) => string);

type Translations = Record<string, TranslationValue | Record<string, TranslationValue>>;

const messages: Record<Language, Translations> = {
  zh_CN: {
    app: {
      name: 'CIC AI 配置助手',
      tagline: '一键配置您的 AI 编码工具',
      version: '版本',
    },
    common: {
      yes: '是',
      no: '否',
      confirm: '确认',
      cancel: '取消',
      continue: '继续',
      back: '返回',
      exit: '退出',
      success: '✓ 成功',
      error: '✗ 失败',
      warning: '⚠ 警告',
      info: 'ℹ 提示',
      loading: '处理中...',
      done: '✓ 完成',
      skip: '跳过',
    },
    lang: {
      select: '请选择界面语言',
      current: '当前语言',
      set: '语言已设置为',
      notFound: '不支持的语言:',
      usage: '用法: cic-ai-config-helper lang <command>',
      commands: '可用命令',
      showDesc: '显示当前语言设置',
      setDesc: '设置界面语言 (zh_CN 或 en_US)',
    },
    auth: {
      title: 'API 密钥设置',
      enterKey: '请输入您的 API 密钥',
      keySaved: '✓ API 密钥已安全保存',
      keyDeleted: '✓ API 密钥已删除',
      keyNotFound: '⚠ 尚未设置 API 密钥',
      keyPrompt: 'API 密钥',
      masked: '当前密钥',
      validating: '正在验证 API 密钥...',
      keyValid: '✓ API 密钥验证通过',
      keyInvalid: '✗ API 密钥无效，请检查后重试',
      reloadSuccess: '✓ 配置已成功加载至 {tool}',
      reloadFail: '✗ 配置加载至 {tool} 失败: {error}',
      chooseTool: '请选择要加载配置的工具',
    },
    init: {
      welcome: '欢迎使用 CIC AI 配置助手！',
      welcomeDesc: '本向导将引导您完成 AI 编码工具的配置',
      step: '步骤',
      of: '/',
      selectLang: '选择界面语言',
      enterKey: '输入 API 密钥',
      selectTools: '选择要配置的 AI 编码工具（可多选）',
      selectModels: '选择要使用的 AI 模型',
      modelsLoading: '正在获取可用模型列表...',
      modelsEmpty: '未获取到模型列表，将使用默认配置',
      confirmConfig: '确认配置',
      complete: '🎉 配置完成！',
      launchPrompt: '是否立即启动已配置的工具？',
      launching: '正在启动...',
      summary: '配置摘要',
      configDone: '✓ 已配置 {count} 个工具，{modelCount} 个模型',
      toolConfigured: '✓ {tool} 已配置',
    },
    tool: {
      title: '工具管理',
      select: '请选择要配置的工具',
      selectPackage: '请选择编码套餐',
      manage: '进入工具管理菜单',
      packageTip: '编码套餐包含一组预定义的配置，一键装载至多个工具',
      launch: '启动 {tool}',
      configure: '配置 {tool}',
      configured: '已配置 ✓',
      notConfigured: '未配置',
      configPath: '配置文件路径',
      openConfig: '打开配置文件',
      configSuccess: '✓ {tool} 配置文件已生成',
    },
    doctor: {
      title: '系统诊断',
      checking: '正在检查系统配置...',
      nodeVersion: 'Node.js 版本',
      configFile: '配置文件',
      apiKey: 'API 密钥',
      toolsStatus: '工具配置状态',
      allGood: '✓ 一切正常！',
      issuesFound: '发现以下问题',
      suggestion: '建议',
      runInit: '运行 cic-ai-config-helper init 完成初始配置',
    },
    error: {
      generic: '发生了一个错误',
      network: '网络连接失败',
      permission: '权限不足',
      invalidKey: '无效的 API 密钥格式',
      toolNotFound: '未找到工具: {tool}',
    },
  },

  en_US: {
    app: {
      name: 'CIC AI Config Helper',
      tagline: 'Configure your AI coding tools in one go',
      version: 'Version',
    },
    common: {
      yes: 'Yes',
      no: 'No',
      confirm: 'Confirm',
      cancel: 'Cancel',
      continue: 'Continue',
      back: 'Back',
      exit: 'Exit',
      success: '✓ Success',
      error: '✗ Failed',
      warning: '⚠ Warning',
      info: 'ℹ Info',
      loading: 'Processing...',
      done: '✓ Done',
      skip: 'Skip',
    },
    lang: {
      select: 'Please select interface language',
      current: 'Current language',
      set: 'Language set to',
      notFound: 'Unsupported language:',
      usage: 'Usage: cic-ai-config-helper lang <command>',
      commands: 'Available commands',
      showDesc: 'Show current language setting',
      setDesc: 'Set interface language (zh_CN or en_US)',
    },
    auth: {
      title: 'API Key Setup',
      enterKey: 'Enter your API key',
      keySaved: '✓ API key saved securely',
      keyDeleted: '✓ API key deleted',
      keyNotFound: '⚠ No API key set',
      keyPrompt: 'API Key',
      masked: 'Current key',
      validating: 'Validating API key...',
      keyValid: '✓ API key is valid',
      keyInvalid: '✗ API key is invalid, please check and retry',
      reloadSuccess: '✓ Configuration loaded into {tool}',
      reloadFail: '✗ Failed to load config into {tool}: {error}',
      chooseTool: 'Select tool to reload configuration',
    },
    init: {
      welcome: 'Welcome to CIC AI Config Helper!',
      welcomeDesc: 'This wizard will guide you through configuring AI coding tools',
      step: 'Step',
      of: 'of',
      selectLang: 'Select interface language',
      enterKey: 'Enter API key',
      selectTools: 'Select AI coding tools (multi-select)',
      selectModels: 'Select AI model to use',
      modelsLoading: 'Fetching available models...',
      modelsEmpty: 'No models found, using defaults',
      confirmConfig: 'Confirm configuration',
      complete: '🎉 Configuration complete!',
      launchPrompt: 'Launch configured tools now?',
      launching: 'Launching...',
      summary: 'Configuration Summary',
      configDone: '✓ Configured {count} tools with {modelCount} models',
      toolConfigured: '✓ {tool} configured',
    },
    tool: {
      title: 'Tool Management',
      select: 'Select tool to configure',
      selectPackage: 'Select coding package',
      manage: 'Enter tool management menu',
      packageTip: 'A coding package contains predefined configurations, loaded into multiple tools in one click',
      launch: 'Launch {tool}',
      configure: 'Configure {tool}',
      configured: 'Configured ✓',
      notConfigured: 'Not configured',
      configPath: 'Config file path',
      openConfig: 'Open config file',
      configSuccess: '✓ {tool} config file generated',
    },
    doctor: {
      title: 'System Diagnosis',
      checking: 'Checking system configuration...',
      nodeVersion: 'Node.js version',
      configFile: 'Config file',
      apiKey: 'API Key',
      toolsStatus: 'Tool configuration status',
      allGood: '✓ All good!',
      issuesFound: 'Issues found',
      suggestion: 'Suggestion',
      runInit: 'Run cic-ai-config-helper init to complete initial setup',
    },
    error: {
      generic: 'An error occurred',
      network: 'Network connection failed',
      permission: 'Insufficient permissions',
      invalidKey: 'Invalid API key format',
      toolNotFound: 'Tool not found: {tool}',
    },
  },
};

export function t(lang: Language, path: string, ...args: string[]): string {
  const keys = path.split('.');
  let current: unknown = messages[lang];

  for (const key of keys) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // fallback to path if not found
    }
  }

  if (typeof current === 'function') {
    return (current as (...args: string[]) => string)(...args);
  }

  if (typeof current === 'string') {
    // Replace {0}, {1}, ... or named placeholders
    let result = current;
    args.forEach((arg, i) => {
      result = result.replace(`{${i}}`, arg);
    });
    return result;
  }

  return String(current ?? path);
}

export function getLang(): Language {
  // Check environment or default to zh_CN
  const env = process.env.CIC_LANG || 'zh_CN';
  if (env === 'en_US') return 'en_US';
  return 'zh_CN';
}
