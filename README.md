# CIC AI Config Helper

<p align="center">
  <strong>Configure compatible AI coding tools from one guided CLI.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/cic-ai-config-helper"><img src="https://img.shields.io/npm/v/cic-ai-config-helper.svg?logo=npm&label=npm" alt="npm package"></a>
  <a href="https://www.npmjs.com/package/cic-ai-config-helper"><img src="https://img.shields.io/npm/dm/cic-ai-config-helper.svg?logo=npm&label=downloads" alt="npm downloads"></a>
  <a href="https://github.com/ericzhang-debug/cic-ai-config-helper/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/cic-ai-config-helper.svg" alt="MIT license"></a>
</p>

<p align="center">
  <a href="readme_cn.md">中文文档</a> · <a href="https://www.npmjs.com/package/cic-ai-config-helper">View on npm</a>
</p>

CIC AI Config Helper is an interactive command-line assistant for configuring compatible AI coding tools with a CIC API key. It validates credentials, discovers models, writes tool-specific configuration, creates recoverable backups, and provides a concise system diagnostic.

## Highlights

- Guided bilingual setup in Chinese or English
- API-key validation and live model discovery from `/v1/models`
- One flow for configuring multiple tools
- Timestamped backups before every write; multi-file configurations are saved as one restore point
- Interactive restore by **tool** and then **backup timestamp**
- Cross-platform command detection for optional post-setup launching
- `doctor` command for checking configuration and tool availability

## Install and run

No global installation is required:

```bash
npx cic-ai-config-helper
```

Or install it globally:

```bash
npm install --global cic-ai-config-helper
cic-ai-config-helper init
```

**Requirements:** Node.js 18 or later, an active CIC API key, and the target tool installed when you want to launch it from the wizard.

## Setup workflow

The initialization wizard guides you through five stages:

1. Choose the interface language.
2. Enter and validate your CIC API key.
3. Select one or more coding tools.
4. Fetch and choose an available model.
5. Review the summary and write the configuration.

Existing configuration files are backed up before they are changed. Select **Launch configured tools now?** at the end to start tools that are installed on your system.

## Commands

| Command | Description |
| --- | --- |
| `cic-ai-config-helper` | Start the setup wizard |
| `cic-ai-config-helper init` | Start the setup wizard explicitly |
| `cic-ai-config-helper lang show` | Show the current language |
| `cic-ai-config-helper lang set zh_CN` | Switch to Simplified Chinese |
| `cic-ai-config-helper lang set en_US` | Switch to English |
| `cic-ai-config-helper auth` | Save or replace the API key interactively |
| `cic-ai-config-helper auth revoke` | Remove the locally saved API key |
| `cic-ai-config-helper auth reload <tool>` | Re-apply configuration for one tool |
| `cic-ai-config-helper doctor` | Inspect local configuration and tool availability |
| `cic-ai-config-helper restore` | Restore a backup by tool and timestamp |

## Supported configuration targets

| Tool | Configuration files |
| --- | --- |
| Claude Code | `~/.claude/settings.json` |
| OpenCode | `~/.config/opencode/opencode.json`, `~/.config/opencode/.env` |
| OpenClaw | `~/.openclaw/openclaw.json` |
| Codex | `~/.codex/config.toml`, `~/.codex/models.json` |
| Hermes | `~/.hermes/config.yaml` |
| CodeBuddy | `~/.codebuddy/models.json` |
| WorkBuddy | `~/.codebuddy/models.json` |
| Deep Code | `~/.deepcode/settings.json` |

## API endpoints

| API | Endpoint |
| --- | --- |
| Base URL | `https://ai.ecustcic.com/api/v1` |
| OpenAI Chat Completions | `https://ai.ecustcic.com/api/v1/chat/completions` |
| OpenAI Responses | `https://ai.ecustcic.com/api/v1/responses` |
| Anthropic Messages | `https://ai.ecustcic.com/api/v1/messages` |
| Embeddings | `https://ai.ecustcic.com/api/v1/embeddings` |

## Backups and local data

Backups are stored under:

```text
~/.config/cic-ai-config-helper/backups/
```

The API key is stored locally in the CIC AI Config Helper configuration directory. Treat generated tool configuration files as sensitive because some tools store the API key directly.

## License

MIT