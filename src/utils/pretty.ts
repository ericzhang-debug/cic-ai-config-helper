import pc from 'picocolors';

/**
 * Render a styled section header
 */
export function section(title: string, subtitle?: string): void {
  const line = pc.dim('─'.repeat(48));
  console.log(`\n${line}`);
  console.log(`  ${pc.bold(pc.cyan(title))}`);
  if (subtitle) {
    console.log(`  ${pc.dim(subtitle)}`);
  }
  console.log(`${line}\n`);
}

/**
 * Render a success message
 */
export function success(msg: string): void {
  console.log(`  ${pc.green('✔')} ${msg}`);
}

/**
 * Render an error message
 */
export function error(msg: string): void {
  console.log(`  ${pc.red('✖')} ${msg}`);
}

/**
 * Render a warning message
 */
export function warn(msg: string): void {
  console.log(`  ${pc.yellow('⚠')} ${msg}`);
}

/**
 * Render an info message
 */
export function info(msg: string): void {
  console.log(`  ${pc.blue('ℹ')} ${msg}`);
}

/**
 * Render a key-value pair
 */
export function kv(key: string, value: string): void {
  console.log(`  ${pc.dim(key + ':')} ${value}`);
}

/**
 * Render the app header / banner
 */
export function showBanner(version: string): void {
  console.log();
  console.log(pc.bold(pc.cyan('  ╭──────────────────────────────╮')));
  console.log(pc.bold(pc.cyan('  │     CIC AI Config Helper     │')));
  console.log(pc.bold(pc.cyan('  ╰──────────────────────────────╯')));
  console.log(`  ${pc.dim(`v${version}`)}`);
  console.log();
}

/**
 * Render a divider line
 */
export function divider(): void {
  console.log(`  ${pc.dim('─'.repeat(44))}`);
}

/**
 * Render a bullet point
 */
export function bullet(text: string, indent = 0): void {
  const pad = '  '.repeat(indent + 1);
  console.log(`${pad}${pc.dim('•')} ${text}`);
}

/**
 * Format a checkmark with color based on boolean
 */
export function checkmark(ok: boolean): string {
  return ok ? pc.green('✓') : pc.red('✗');
}
