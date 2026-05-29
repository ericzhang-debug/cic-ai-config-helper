# CIC AI Config Helper 🚀

一键配置您的 AI 编码工具 — Claude Code / OpenCode

## 快速开始

```bash
# 直接运行（npx 自动下载）
npx cic-ai-config-helper

# 或者显式启动向导
npx cic-ai-config-helper init
```

## 特性

- ✨ **交互式向导** — 上下方向键选择 + 空格多选，回车确认
- 🔑 **自动验证** — 输入 API 密钥后自动调用 `/v1/models` 验证有效性
- 🛠️ **自由选工具** — 多选你要配置的 AI 编码工具
- 🤖 **动态选模型** — 从 `/v1/models` 实时获取模型列表，自由选择
- 💾 **自动备份** — 每次配置前自动备份原文件
- 🔄 **一键恢复** — 从备份中恢复到任意历史版本
- 🌍 **双语支持** — 中文 / English
- 🏥 **系统诊断** — 检查配置状态与工具可用性

## 完整命令

### 初始化向导

```bash
cic-ai-config-helper              # 默认启动向导
cic-ai-config-helper init         # 显式启动向导
```

向导流程：
1. **选择界面语言** — 🇨🇳 中文 / 🇺🇸 English
2. **输入 API 密钥** → 自动调用 `/v1/models` **验证密钥有效性**
3. **选择 AI 编码工具** — 多选：Claude Code / OpenCode
4. **选择 AI 模型** — 从 `/v1/models` **动态拉取模型列表**，自由多选
5. **确认配置** — 查看摘要，确认后自动生成配置文件
6. **启动工具**（可选）

### 语言管理

```bash
cic-ai-config-helper lang show              # 显示当前语言
cic-ai-config-helper lang set zh_CN         # 设置为中文
cic-ai-config-helper lang set en_US         # 设置为英文
cic-ai-config-helper lang --help            # 查看帮助
```

### API 密钥管理

```bash
cic-ai-config-helper auth                   # 交互式设置密钥
cic-ai-config-helper auth revoke            # 删除已保存的密钥
cic-ai-config-helper auth reload claude     # 将配置加载至 Claude Code
cic-ai-config-helper auth reload cursor     # 将配置加载至 Cursor
cic-ai-config-helper auth --help            # 查看帮助
```

### 系统诊断

```bash
cic-ai-config-helper doctor                 # 检查系统配置状态
```

### 备份恢复

每次配置工具前，助手会**自动备份**已有配置文件。

```bash
cic-ai-config-helper restore               # 交互式恢复配置
```

恢复流程：选择工具 → 选择备份版本（按时间） → 确认恢复

备份存储在 `~/.config/cic-ai-config-helper/backups/` 目录下，按工具和版本时间组织。

### 通用

```bash
cic-ai-config-helper --help                 # 显示全部帮助
cic-ai-config-helper --version              # 显示版本
```

## 配置的 Base URLs

| 服务 | 端点 |
|------|------|
| API 基础地址 | `https://ai.ecustcic.com/api/v1` |
| Chat Completions (OpenAI) | `https://ai.ecustcic.com/api/v1/chat/completions` |
| Chat (Ollama) | `https://ai.ecustcic.com/api/ollama/api/chat` |
| Responses (OpenAI) | `https://ai.ecustcic.com/api/v1/responses` |
| Messages (Anthropic Claude) | `https://ai.ecustcic.com/api/v1/messages` |
| Embeddings (OpenAI) | `https://ai.ecustcic.com/api/v1/embeddings` |

## 支持的 7 种 AI 编码工具

| 工具 | 图标 | 配置文件 |
|------|------|----------|
| **Claude Code** | 🤖 | `~/.claude/settings.json` |
| **OpenCode** | 📂 | `~/.config/opencode/config.json` |

## 发布到 npm

```bash
cd cic-ai-config-helper

# 登录
npm login

# 发布
npm publish

# 完成！用户只需：
npx cic-ai-config-helper
```

## License

MIT
