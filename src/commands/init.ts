import { intro, outro, confirm, select, multiselect, text, spinner, isCancel, cancel } from '@clack/prompts';
import pc from 'picocolors';
import { t, getLang } from '../utils/i18n.js';
import {
  setConfig,
  getApiKey,
  setApiKey,
  setSelectedModels,
  setToolConfigured,
  isToolConfigured,
} from '../utils/config.js';
import {
  configureTool,
  launchTool,
  isToolAvailable,
  getToolConfigPaths,
  validateApiKey,
  fetchModels,
} from '../utils/tools.js';
import { TOOLS } from '../types.js';
import type { Language, AiToolId } from '../types.js';
import { success, error, info, warn, divider, section } from '../utils/pretty.js';

export async function initCommand(): Promise<void> {
  const lang = getLang();

  intro(pc.bold(pc.cyan(` ✨ ${t(lang, 'init.welcome')}`)));
  info(t(lang, 'init.welcomeDesc'));
  console.log();

  // ── Step 1: Select Language ────────────────────────────────
  const selectedLang = await selectLanguage(lang);
  if (!selectedLang) return;
  setConfig({ language: selectedLang });
  const L = selectedLang;
  success(`${t(L, 'lang.set')}: ${pc.bold(selectedLang)}`);

  // ── Step 2: Enter & Validate API Key ──────────────────────
  const apiKey = await enterAndValidateKey(L);
  if (!apiKey) return;
  setApiKey(apiKey);
  success(t(L, 'auth.keySaved'));

  // ── Step 3: Select Tools (multi-select) ───────────────────
  const selectedTools = await selectTools(L);
  if (!selectedTools || selectedTools.length === 0) return;

  // ── Step 4: Fetch & Select Models ─────────────────────────
  const selectedModels = await selectModels(L, apiKey);
  if (!selectedModels) return; // user cancelled

  // ── Step 5: Confirm & Configure ──────────────────────────
  section(t(L, 'init.summary'));

  console.log(`  ${pc.bold(t(L, 'init.selectTools'))}`);
  for (const toolId of selectedTools) {
    const profile = TOOLS.find((t) => t.id === toolId);
    const name = L === 'zh_CN' ? profile?.nameZh : profile?.name;
    console.log(`    ${profile?.icon ?? ''}  ${pc.bold(name ?? toolId)}`);
  }

  console.log(`\n  ${pc.bold(t(L, 'init.selectModels'))}`);
  for (const modelId of selectedModels) {
    console.log(`    ${pc.cyan('◆')}  ${pc.bold(modelId)}`);
  }

  divider();

  const confirmed = await confirm({
    message: t(L, 'common.confirm'),
    initialValue: true,
  });
  if (isCancel(confirmed) || !confirmed) {
    cancel(t(L, 'common.cancel'));
    return;
  }

  // ── Apply configuration ──────────────────────────────────
  const spin = spinner();
  spin.start(t(L, 'common.loading'));

  setSelectedModels(selectedModels);

  let configured = 0;
  for (const toolId of selectedTools) {
    const ok = configureTool(toolId, selectedModels);
    if (ok) {
      setToolConfigured(toolId, true);
      configured++;
    }
  }
  spin.stop(t(L, 'common.done'));

  // Summary
  success(t(L, 'init.configDone', String(configured), String(selectedModels.length)));

  for (const toolId of selectedTools) {
    const profile = TOOLS.find((t) => t.id === toolId);
    const name = L === 'zh_CN' ? profile?.nameZh : profile?.name;
    const paths = getToolConfigPaths(toolId);
    const ok = isToolConfigured(toolId);
    console.log(
      `  ${ok ? pc.green('✔') : pc.red('✗')} ${profile?.icon ?? ''} ${pc.bold(name ?? toolId)}`
    );
    if (ok && paths.length > 0) {
      info(`${t(L, 'tool.configPath')}: ${pc.dim(paths[0])}`);
    }
  }
  divider();

  // Show backup info
  info(L === 'zh_CN'
    ? pc.dim('原有配置已自动备份到 ~/.config/cic-ai-config-helper/backups/')
    : pc.dim('Previous config auto-backed up to ~/.config/cic-ai-config-helper/backups/'));
  info(L === 'zh_CN'
    ? pc.dim('运行 cic-ai-config-helper restore 可以恢复')
    : pc.dim('Run cic-ai-config-helper restore to revert'));

  // ── Option to launch tools ────────────────────────────────
  const shouldLaunch = await confirm({
    message: t(L, 'init.launchPrompt'),
    initialValue: false,
  });

  if (isCancel(shouldLaunch)) {
    cancel(t(L, 'common.cancel'));
    return;
  }

  if (shouldLaunch) {
    const lspin = spinner();
    lspin.start(t(L, 'init.launching'));

    for (const toolId of selectedTools) {
      const available = isToolAvailable(toolId);
      if (available) {
        const launched = launchTool(toolId);
        if (launched) {
          const profile = TOOLS.find((t) => t.id === toolId);
          const name = L === 'zh_CN' ? profile?.nameZh : profile?.name;
          success(t(L, 'tool.launch', name ?? toolId));
        }
      }
    }
    lspin.stop(t(L, 'common.done'));
  }

  console.log();
  outro(pc.bold(pc.green(` 🎉 ${t(L, 'init.complete')}`)));
}

// ──────────────────────────────────────────────────────────────
//  Helper functions
// ──────────────────────────────────────────────────────────────

async function selectLanguage(currentLang: Language): Promise<Language | null> {
  const result = await select({
    message: t(currentLang, 'lang.select'),
    options: [
      { value: 'zh_CN' as Language, label: '🇨🇳 中文 (简体)' },
      { value: 'en_US' as Language, label: '🇺🇸 English' },
    ],
    initialValue: currentLang,
  });

  if (isCancel(result)) {
    cancel(t(currentLang, 'common.cancel'));
    return null;
  }
  return result as Language;
}

async function enterAndValidateKey(lang: Language): Promise<string | null> {
  const existingKey = getApiKey();

  if (existingKey) {
    const masked = existingKey.length > 8
      ? `${existingKey.slice(0, 4)}${'*'.repeat(existingKey.length - 8)}${existingKey.slice(-4)}`
      : '****';
    info(`${t(lang, 'auth.masked')}: ${pc.dim(masked)}`);

    const reuse = await confirm({
      message: t(lang, 'common.continue') + '?',
      initialValue: true,
    });

    if (isCancel(reuse)) {
      cancel(t(lang, 'common.cancel'));
      return null;
    }

    if (reuse) {
      // Validate the existing key
      const valid = await validateKey(lang, existingKey);
      if (valid) return existingKey;
      // If invalid, fall through to re-enter
      warn(t(lang, 'auth.keyInvalid'));
    }
  }

  // Loop until a valid key is entered or user cancels
  while (true) {
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
      return null;
    }

    const trimmedKey = (key as string).trim();
    const valid = await validateKey(lang, trimmedKey);
    if (valid) return trimmedKey;

    // Key invalid, ask whether to retry or cancel
    const retry = await confirm({
      message: lang === 'zh_CN' ? '要重新输入吗？' : 'Try again?',
      initialValue: true,
    });

    if (isCancel(retry) || !retry) {
      cancel(t(lang, 'common.cancel'));
      return null;
    }
  }
}

async function validateKey(lang: Language, apiKey: string): Promise<boolean> {
  const spin = spinner();
  spin.start(t(lang, 'auth.validating'));

  const valid = await validateApiKey(apiKey);

  if (valid) {
    spin.stop(t(lang, 'auth.keyValid'));
    return true;
  } else {
    spin.stop(t(lang, 'auth.keyInvalid'));
    return false;
  }
}

async function selectTools(lang: Language): Promise<AiToolId[] | null> {
  const result = await multiselect({
    message: t(lang, 'init.selectTools'),
    options: TOOLS.map((tool) => ({
      value: tool.id,
      label: `${tool.icon}  ${lang === 'zh_CN' ? tool.nameZh : tool.name}`,
      hint: lang === 'zh_CN' ? tool.descriptionZh : tool.description,
    })),
    required: true,
  });

  if (isCancel(result)) {
    cancel(t(lang, 'common.cancel'));
    return null;
  }

  return result as AiToolId[];
}

async function selectModels(lang: Language, apiKey: string): Promise<string[] | null> {
  const spin = spinner();
  spin.start(t(lang, 'init.modelsLoading'));

  const models = await fetchModels(apiKey);

  if (models.length === 0) {
    spin.stop(t(lang, 'init.modelsEmpty'));
    // Return default model
    return ['claude-sonnet-4-20250514'];
  }

  spin.stop(`${t(lang, 'common.done')} (${models.length} models)`);

  // Sort: likely useful chat models first
  const sorted = [...models].sort((a, b) => {
    const aPriority = a.id.includes('claude') || a.id.includes('gpt') || a.id.includes('deepseek') ? 0 : 1;
    const bPriority = b.id.includes('claude') || b.id.includes('gpt') || b.id.includes('deepseek') ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.id.localeCompare(b.id);
  });

  // Show in pages if too many (pick reasonable max)
  const displayModels = sorted.slice(0, 50);

  const result = await select({
    message: t(lang, 'init.selectModels'),
    options: displayModels.map((m) => ({
      value: m.id,
      label: m.id,
      hint: m.owned_by ? `${m.owned_by}` : undefined,
    })),
  });

  if (isCancel(result)) {
    cancel(t(lang, 'common.cancel'));
    return null;
  }

  return [result as string];
}
