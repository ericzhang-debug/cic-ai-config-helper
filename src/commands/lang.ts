import { outro, isCancel, cancel } from '@clack/prompts';
import pc from 'picocolors';
import { t } from '../utils/i18n.js';
import { getLanguage, setLanguage } from '../utils/config.js';
import { success, error, info, section } from '../utils/pretty.js';
import type { Language } from '../types.js';

export function langShow(): void {
  const lang = getLanguage();
  const name = lang === 'zh_CN' ? '中文 (简体)' : 'English';
  section(t(lang, 'lang.current'));
  console.log(`  ${pc.bold(name)}  (${pc.dim(lang)})`);
  outro('✨');
}

export function langSet(code: string): void {
  const lang = getLanguage();

  if (code !== 'zh_CN' && code !== 'en_US') {
    error(`${t(lang, 'lang.notFound')} ${pc.bold(code)}`);
    process.exit(1);
  }

  setLanguage(code as Language);

  const name = code === 'zh_CN' ? '中文 (简体)' : 'English';
  success(`${t(code === 'zh_CN' ? 'zh_CN' : 'en_US', 'lang.set')} ${pc.bold(name)} (${pc.dim(code)})`);
  outro('✨');
}

export function langHelp(): void {
  const lang = getLanguage();

  section(t(lang, 'lang.usage'));
  console.log(`  ${pc.bold('cic-ai-config-helper lang show')}        ${pc.dim(t(lang, 'lang.showDesc'))}`);
  console.log(`  ${pc.bold('cic-ai-config-helper lang set <code>')}   ${pc.dim(t(lang, 'lang.setDesc'))}`);
  console.log();
  console.log(`  ${pc.dim(t(lang, 'lang.commands') + ':')}`);
  console.log(`    ${pc.cyan('show')}     ${pc.dim('- ' + t(lang, 'lang.showDesc'))}`);
  console.log(`    ${pc.cyan('set')}      ${pc.dim('- ' + t(lang, 'lang.setDesc'))}`);
  console.log();
}
