import { intro, outro, select, multiselect, confirm, spinner, isCancel, cancel } from '@clack/prompts';
import pc from 'picocolors';
import { t, getLang } from '../utils/i18n.js';
import {
  listBackups,
  restoreBackup,
  getBackupRoot,
  getToolConfigPaths,
} from '../utils/tools.js';
import { setToolConfigured } from '../utils/config.js';
import { TOOLS } from '../types.js';
import type { AiToolId, BackupEntry } from '../utils/tools.js';
import { success, error, info, warn, divider, section } from '../utils/pretty.js';

// ──────────────────────────────────────────────────────────────
//  restore — interactive restore wizard
// ──────────────────────────────────────────────────────────────

export async function restoreInteractiveCommand(): Promise<void> {
  const lang = getLang();

  intro(pc.bold(pc.cyan(` 🔄 ${restoreMsg(lang, 'title')}`)));

  const allBackups = listBackups();

  if (allBackups.length === 0) {
    warn(restoreMsg(lang, 'noBackups'));
    info(`${restoreMsg(lang, 'backupDir')}: ${pc.dim(getBackupRoot())}`);
    outro('✨');
    return;
  }

  // ── Step 1: Pick tool ────────────────────────────────────
  // Find which tools have backups
  const toolsWithBackups = [...new Set(allBackups.map((b) => b.toolId))];

  if (toolsWithBackups.length === 1) {
    // Only one tool, skip selection
    await restoreForTool(toolsWithBackups[0], lang, allBackups);
  } else {
    const toolResult = await select({
      message: restoreMsg(lang, 'selectTool'),
      options: toolsWithBackups.map((toolId) => {
        const profile = TOOLS.find((t) => t.id === toolId);
        const count = allBackups.filter((b) => b.toolId === toolId).length;
        return {
          value: toolId,
          label: `${profile?.icon ?? ''}  ${lang === 'zh_CN' ? profile?.nameZh : profile?.name}  ${pc.dim(`(${count} ${restoreMsg(lang, 'backups')})`)}`,
        };
      }),
    });

    if (isCancel(toolResult)) {
      cancel(t(lang, 'common.cancel'));
      return;
    }
    await restoreForTool(toolResult as AiToolId, lang, allBackups);
  }
}

async function restoreForTool(toolId: AiToolId, lang: string, allBackups: BackupEntry[]): Promise<void> {
  const toolBackups = allBackups.filter((b) => b.toolId === toolId);
  const profile = TOOLS.find((t) => t.id === toolId);
  const toolName = lang === 'zh_CN' ? profile?.nameZh : profile?.name;

  section(`${profile?.icon ?? ''}  ${toolName} — ${restoreMsg(lang, 'selectBackup')}`);

  // ── Step 2: Pick backup version ──────────────────────────
  const backupResult = await select({
    message: restoreMsg(lang, 'version'),
    options: toolBackups.map((b) => ({
      value: b.timestamp,
      label: b.label,
      hint: b.files.join(', '),
    })),
  });

  if (isCancel(backupResult)) {
    cancel(t(lang, 'common.cancel'));
    return;
  }

  const timestamp = backupResult as string;
  const entry = toolBackups.find((b) => b.timestamp === timestamp);

  console.log();
  info(`${restoreMsg(lang, 'willRestore')}:`);
  if (entry) {
    for (const file of entry.files) {
      const paths = getToolConfigPaths(toolId);
      const origPath = paths.find((p) => p.endsWith(file)) || file;
      console.log(`  ${pc.dim('↩')} ${pc.bold(origPath)}`);
    }
  }
  divider();

  const confirmed = await confirm({
    message: restoreMsg(lang, 'confirm'),
    initialValue: false,
  });

  if (isCancel(confirmed) || !confirmed) {
    cancel(t(lang, 'common.cancel'));
    return;
  }

  const spin = spinner();
  spin.start(restoreMsg(lang, 'restoring'));

  const ok = restoreBackup(toolId, timestamp);

  if (ok) {
    setToolConfigured(toolId, true);
    spin.stop(restoreMsg(lang, 'restored'));
    success(`${restoreMsg(lang, 'restoreSuccess')} — ${toolName}`);
  } else {
    spin.stop(restoreMsg(lang, 'failed'));
    error(restoreMsg(lang, 'restoreFail'));
  }

  outro('✨');
}

// ──────────────────────────────────────────────────────────────
//  Helper: multilingual restore messages
// ──────────────────────────────────────────────────────────────

function restoreMsg(lang: string, key: string): string {
  const dict: Record<string, Record<string, string>> = {
    zh_CN: {
      title: '恢复配置',
      noBackups: '没有找到备份',
      backupDir: '备份目录',
      selectTool: '选择要恢复的工具',
      selectBackup: '选择要恢复的备份版本',
      version: '选择备份版本',
      backups: '个备份',
      willRestore: '将恢复以下文件',
      confirm: '确认恢复？此操作将覆盖当前配置',
      restoring: '正在恢复...',
      restored: '✓ 恢复完成',
      restoreSuccess: '✓ 配置已从备份恢复',
      restoreFail: '✗ 恢复失败',
      failed: '✗ 失败',
    },
    en_US: {
      title: 'Restore Configuration',
      noBackups: 'No backups found',
      backupDir: 'Backup directory',
      selectTool: 'Select tool to restore',
      selectBackup: 'Select backup version to restore',
      version: 'Select backup version',
      backups: 'backups',
      willRestore: 'Will restore the following files',
      confirm: 'Confirm restore? This will overwrite current config',
      restoring: 'Restoring...',
      restored: '✓ Restored',
      restoreSuccess: '✓ Configuration restored from backup',
      restoreFail: '✗ Restore failed',
      failed: '✗ Failed',
    },
  };
  return dict[lang]?.[key] ?? dict.zh_CN[key] ?? key;
}
