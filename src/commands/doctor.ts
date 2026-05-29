import { intro, outro, spinner } from '@clack/prompts';
import pc from 'picocolors';
import { t, getLang } from '../utils/i18n.js';
import { getApiKey, isToolConfigured, getConfigPath, getConfig } from '../utils/config.js';
import { isToolAvailable, getToolConfigPaths } from '../utils/tools.js';
import { TOOLS } from '../types.js';
import { success, error, info, warn, section, divider, kv, checkmark, bullet } from '../utils/pretty.js';

export function doctorCommand(): void {
  const lang = getLang();

  intro(pc.bold(pc.cyan(` 🏥 ${t(lang, 'doctor.title')}`)));

  const spin = spinner();
  spin.start(t(lang, 'doctor.checking'));

  // Collect all results
  const results: { ok: boolean; label: string; detail: string }[] = [];

  // Node.js version
  const nodeVersion = process.version;
  const nodeOk = parseInt(nodeVersion.slice(1)) >= 18;
  results.push({
    ok: nodeOk,
    label: t(lang, 'doctor.nodeVersion'),
    detail: nodeVersion,
  });

  // Config file
  const configPath = getConfigPath();
  const cfg = getConfig();
  results.push({
    ok: true,
    label: t(lang, 'doctor.configFile'),
    detail: configPath,
  });

  // API key
  const apiKey = getApiKey();
  const keyOk = !!apiKey && apiKey.length >= 8;
  results.push({
    ok: keyOk,
    label: t(lang, 'doctor.apiKey'),
    detail: keyOk
      ? apiKey!.length > 8
        ? `${apiKey!.slice(0, 4)}${'*'.repeat(apiKey!.length - 8)}${apiKey!.slice(-4)}`
        : '****'
      : '—',
  });

  // Language
  const langOk = true;

  // Tools
  const toolResults = TOOLS.map((tool) => {
    const configured = isToolConfigured(tool.id);
    const available = isToolAvailable(tool.id);
    return {
      ok: configured,
      id: tool.id,
      name: lang === 'zh_CN' ? tool.nameZh : tool.name,
      icon: tool.icon,
      configured,
      available,
    };
  });

  spin.stop(t(lang, 'common.done'));
  console.log();

  // Print results
  section(t(lang, 'doctor.title'));

  for (const r of results) {
    const icon = r.ok ? pc.green('✔') : pc.red('✗');
    console.log(`  ${icon} ${pc.bold(r.label)}`);
    console.log(`    ${pc.dim(r.detail)}`);
  }

  console.log();
  info(t(lang, 'doctor.toolsStatus'));

  for (const tr of toolResults) {
    const icon = tr.ok ? pc.green('✔') : pc.dim('—');
    const status = tr.configured
      ? pc.green(t(lang, 'tool.configured'))
      : pc.dim(t(lang, 'tool.notConfigured'));
    const avail = tr.available ? pc.dim('(available)') : pc.dim('(not found)');
    console.log(`  ${icon} ${tr.icon} ${pc.bold(tr.name)}  ${status} ${avail}`);
  }

  divider();

  // Summary
  const allOk = results.every((r) => r.ok);
  const anyToolConfigured = toolResults.some((t) => t.configured);

  if (allOk && anyToolConfigured) {
    success(t(lang, 'doctor.allGood'));
  } else {
    warn(t(lang, 'doctor.issuesFound'));
    if (!keyOk) {
      bullet(`${t(lang, 'doctor.suggestion')}: ${t(lang, 'doctor.runInit')}`);
    }
    if (!anyToolConfigured) {
      bullet(`${t(lang, 'doctor.suggestion')}: ${t(lang, 'doctor.runInit')}`);
    }
  }

  outro('✨');
}
