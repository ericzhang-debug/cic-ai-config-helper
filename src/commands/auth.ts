import { intro, outro, select, isCancel, cancel, confirm, text, spinner } from '@clack/prompts';
import pc from 'picocolors';
import { t, getLang } from '../utils/i18n.js';
import { getApiKey, setApiKey, deleteApiKey, setToolConfigured } from '../utils/config.js';
import { configureTool } from '../utils/tools.js';
import { TOOLS } from '../types.js';
import type { AiToolId } from '../types.js';
import { success, error, info, warn, section, divider } from '../utils/pretty.js';

export async function authInteractive(): Promise<void> {
  const lang = getLang();

  intro(pc.bold(pc.cyan(` 🔑 ${t(lang, 'auth.title')}`)));

  const existingKey = getApiKey();

  if (existingKey) {
    const masked = existingKey.length > 8
      ? `${existingKey.slice(0, 4)}${'*'.repeat(existingKey.length - 8)}${existingKey.slice(-4)}`
      : '****';
    info(`${t(lang, 'auth.masked')}: ${pc.dim(masked)}`);

    const change = await confirm({
      message: '更换密钥？' + (lang === 'en_US' ? ' Change key?' : ''),
      initialValue: false,
    });

    if (isCancel(change)) {
      cancel(t(lang, 'common.cancel'));
      return;
    }

    if (!change) {
      outro('✨');
      return;
    }
  }

  const key = await text({
    message: t(lang, 'auth.enterKey'),
    placeholder: 'sk-...',
    validate: (value) => {
      if (!value || value.trim().length < 8) {
        return t(lang, 'error.invalidKey');
      }
      return undefined;
    },
  });

  if (isCancel(key)) {
    cancel(t(lang, 'common.cancel'));
    return;
  }

  setApiKey((key as string).trim());

  // Optionally configure tools right after
  const configureNow = await confirm({
    message: lang === 'zh_CN' ? '立即配置工具？' : 'Configure tools now?',
    initialValue: true,
  });

  if (isCancel(configureNow)) {
    cancel(t(lang, 'common.cancel'));
    return;
  }

  if (configureNow) {
    const toolResult = await select({
      message: lang === 'zh_CN' ? '选择要配置的工具：' : 'Select tool to configure:',
      options: TOOLS.map((t) => ({
        value: t.id,
        label: `${t.icon}  ${lang === 'zh_CN' ? t.nameZh : t.name}  ${pc.dim(lang === 'zh_CN' ? t.descriptionZh : t.description)}`,
      })),
    });

    if (isCancel(toolResult)) {
      cancel(t(lang, 'common.cancel'));
      return;
    }

    const spin = spinner();
    spin.start(t(lang, 'common.loading'));

    const ok = configureTool(toolResult as AiToolId);
    if (ok) {
      setToolConfigured(toolResult as AiToolId, true);
      spin.stop(t(lang, 'common.done'));
      success(t(lang, 'tool.configSuccess', TOOLS.find((t) => t.id === toolResult)?.name ?? ''));
    } else {
      spin.stop(t(lang, 'common.error'));
      error(t(lang, 'error.generic'));
    }
  }

  console.log();
  success(t(lang, 'auth.keySaved'));
  outro('✨');
}

export function authRevoke(): void {
  const lang = getLang();

  if (!getApiKey()) {
    warn(t(lang, 'auth.keyNotFound'));
    return;
  }

  deleteApiKey();
  success(t(lang, 'auth.keyDeleted'));
}

export async function authReload(toolName?: string): Promise<void> {
  const lang = getLang();

  if (!getApiKey()) {
    error(t(lang, 'auth.keyNotFound'));
    info(t(lang, 'doctor.runInit'));
    return;
  }

  let targetId: AiToolId;

  if (toolName) {
    const tool = TOOLS.find(
      (t) => t.id === toolName || t.name.toLowerCase() === toolName.toLowerCase()
    );
    if (!tool) {
      error(t(lang, 'error.toolNotFound', toolName));
      process.exit(1);
    }
    targetId = tool.id;
  } else {
    const result = await select({
      message: t(lang, 'auth.chooseTool'),
      options: TOOLS.map((t) => ({
        value: t.id,
        label: `${t.icon}  ${lang === 'zh_CN' ? t.nameZh : t.name}`,
      })),
    });

    if (isCancel(result)) {
      cancel(t(lang, 'common.cancel'));
      return;
    }
    targetId = result as AiToolId;
  }

  const profile = TOOLS.find((t) => t.id === targetId);
  const name = lang === 'zh_CN' ? profile?.nameZh : profile?.name;

  const spin = spinner();
  spin.start(t(lang, 'common.loading'));

  const ok = configureTool(targetId);
  if (ok) {
    setToolConfigured(targetId, true);
    spin.stop(t(lang, 'common.done'));
    success(t(lang, 'auth.reloadSuccess', name ?? targetId));
  } else {
    spin.stop(t(lang, 'common.error'));
    error(t(lang, 'auth.reloadFail', name ?? targetId, t(lang, 'error.generic')));
  }

  outro('✨');
}

export function authHelp(): void {
  const lang = getLang();

  section('cic-ai-config-helper auth');
  console.log(`  ${pc.bold('cic-ai-config-helper auth')}                ${pc.dim(lang === 'zh_CN' ? '交互式设置密钥' : 'Interactive key setup')}`);
  console.log(`  ${pc.bold('cic-ai-config-helper auth revoke')}         ${pc.dim(lang === 'zh_CN' ? '删除已保存的密钥' : 'Delete saved key')}`);
  console.log(`  ${pc.bold('cic-ai-config-helper auth reload <tool>')}  ${pc.dim(lang === 'zh_CN' ? '重新加载工具配置' : 'Reload tool config')}`);
  console.log();
}
