#!/usr/bin/env node

import { Command } from 'commander';
import { intro, cancel, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { showBanner } from './utils/pretty.js';
import { initCommand } from './commands/init.js';
import { langShow, langSet, langHelp } from './commands/lang.js';
import {
  authInteractive,
  authRevoke,
  authReload,
  authHelp,
} from './commands/auth.js';
import { doctorCommand } from './commands/doctor.js';
import { restoreInteractiveCommand } from './commands/backup.js';

// --- Read version from package.json ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkgPath = join(__dirname, '..', 'package.json');
let version = '1.0.0';
try {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  version = pkg.version;
} catch {
  // Fallback: try from cwd
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
    version = pkg.version;
  } catch {
    // ignore
  }
}

// --- Global error handler ---
process.on('uncaughtException', (err) => {
  console.error(`\n  ${pc.red('✖')} ${pc.bold('Unexpected error:')} ${err.message}`);
  process.exit(1);
});

// --- Build CLI ---
const program = new Command();

program
  .name('cic-ai-config-helper')
  .description('CIC AI Config Helper — 一键配置 AI 编码工具')
  .version(version, '--version')
  .helpOption('-h, --help', '显示帮助信息')
  .addHelpText('before', () => {
    showBanner(version);
    return '';
  })
;

// --- init ---
program
  .command('init')
  .description('运行初始化向导 — 交互式配置 AI 编码工具')
  .action(async () => {
    try {
      await initCommand();
    } catch (err) {
      console.error(`\n  ${pc.red('✖')} ${pc.bold('Error:')} ${(err as Error).message}`);
      process.exit(1);
    }
  });

// --- lang ---
const langCmd = program
  .command('lang')
  .description('语言管理 — 查看与设置界面语言')
  .action(() => {
    langHelp();
  });

langCmd
  .command('show')
  .description('显示当前语言设置')
  .action(langShow);

langCmd
  .command('set')
  .description('设置界面语言 (zh_CN 或 en_US)')
  .argument('<code>', '语言代码: zh_CN / en_US')
  .action(langSet);

langCmd
  .command('help')
  .description('查看语言命令帮助')
  .action(langHelp);

// --- auth ---
const authCmd = program
  .command('auth')
  .description('API 密钥管理 — 设置 / 删除 / 重新加载')
  .action(async () => {
    try {
      await authInteractive();
    } catch (err) {
      console.error(`\n  ${pc.red('✖')} ${pc.bold('Error:')} ${(err as Error).message}`);
      process.exit(1);
    }
  });

authCmd
  .command('revoke')
  .description('删除已保存的 API 密钥')
  .action(authRevoke);

authCmd
  .command('reload')
  .description('将最新配置加载至指定工具')
  .argument('[tool]', '工具名称 (claude-code / cursor / continue / github-copilot)')
  .action(async (tool?: string) => {
    try {
      await authReload(tool);
    } catch (err) {
      console.error(`\n  ${pc.red('✖')} ${pc.bold('Error:')} ${(err as Error).message}`);
      process.exit(1);
    }
  });

authCmd
  .command('help')
  .description('查看认证命令帮助')
  .action(authHelp);

// --- doctor ---
program
  .command('doctor')
  .description('系统诊断 — 检查配置状态与工具可用性')
  .action(() => {
    try {
      doctorCommand();
    } catch (err) {
      console.error(`\n  ${pc.red('✖')} ${pc.bold('Error:')} ${(err as Error).message}`);
      process.exit(1);
    }
  });

// --- restore ---
program
  .command('restore')
  .description('从备份恢复工具配置 — 交互式选择备份版本')
  .action(async () => {
    try {
      await restoreInteractiveCommand();
    } catch (err) {
      console.error(`\n  ${pc.red('✖')} ${pc.bold('Error:')} ${(err as Error).message}`);
      process.exit(1);
    }
  });

// --- Default: no args → run init; otherwise use commander ---
const args = process.argv.slice(2);
const hasSubcommand = args.some(a => !a.startsWith('-'));

if (args.length === 0) {
  // npx cic-ai-config-helper → run init wizard directly
  initCommand().catch((err) => {
    console.error(`\n  ${pc.red('✖')} ${pc.bold('Error:')} ${(err as Error).message}`);
    process.exit(1);
  });
} else if (hasSubcommand) {
  // Has a subcommand (init, lang, auth, doctor, help) → commander handles
  program.parse(process.argv);
} else {
  // Only flags (--help, --version) → let commander handle
  program.parse(process.argv);
}
