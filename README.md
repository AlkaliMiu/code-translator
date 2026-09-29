# 代码翻译器

把一段陌生的 Python、JavaScript 或 TypeScript 代码，转换成初学者可以逐步阅读的交互式教材。

这不是聊天壳：结果会固定拆成一句话概览、执行流程、代码步骤、关键概念、注意事项和小测验。解释步骤与 Monaco Editor 中的代码行双向联动。

## 已实现

- Monaco Editor：行号、语法高亮、编辑、粘贴、清空与代码行高亮
- Python / JavaScript / TypeScript 选择和粘贴时的简单自动识别
- 中文 / English 界面切换，并同步切换示例、Demo 教材和 AI 输出语言
- 5 个短小示例：Python 循环、列表推导式、JS 数组、异步请求、TS 接口
- 零基础 / 入门 / 进阶三种解释深度
- 结构化结果：`summary`、`flow`、`steps`、`concepts`、`warnings`、`quiz`
- 点击或聚焦解释步骤时高亮代码；点击代码行时定位对应步骤
- “用更简单的话解释”、测验反馈、加载/空白/错误状态
- 浅色与深色主题、键盘焦点、减少动态效果、桌面/手机响应式布局
- 无密钥可完整体验的本地 Demo provider，并在界面明确标识
- 可替换的 HTTP provider，包含超时、错误和畸形响应兜底
- GitHub Pages 自动部署工作流
- 可选 Cloudflare Worker AI 后端示例

## 本地运行

需要 Node.js 22+ 与 pnpm 11。

```bash
pnpm install
pnpm dev
```

打开终端显示的本地地址。默认不需要任何 API Key，使用 Demo 模式。

完整检查：

```bash
pnpm check
```

该命令依次执行 ESLint、Vitest 单元测试、生产构建和 Worker TypeScript 检查。

## 前端配置

复制 `.env.example` 为 `.env.local`：

```env
VITE_AI_PROVIDER=demo
VITE_AI_ENDPOINT=https://your-worker.example.workers.dev
VITE_AI_TIMEOUT_MS=25000
```

- `demo`：只在浏览器中运行本地解释规则，不上传代码。
- `http`：向 `${VITE_AI_ENDPOINT}/explain` 发送结构化请求。
- 所有 `VITE_` 变量都会进入前端构建产物，所以这里只能放公开配置，**绝不能放 API Key**。

产品名称集中在 `src/config/brand.ts`，以后更名只需从这里开始修改。

## 部署到 GitHub Pages

1. 把 `code-translator` 目录作为仓库根目录推送到 GitHub，默认分支命名为 `main`。
2. 在仓库 **Settings → Pages → Build and deployment** 中，将 Source 选择为 **GitHub Actions**。
3. 推送 `main`，或在 Actions 页面手动运行 `Deploy to GitHub Pages`。
4. 工作流会安装依赖、完成全部检查、上传 `dist` 并发布。

Vite 使用相对资源基址 `./`，因此同时适配 `username.github.io/repository/` 子路径和自定义域名。本项目没有客户端路由，刷新不会遇到 Pages 的 SPA 回退问题。

若要在 Pages 使用真实后端，在仓库 **Settings → Secrets and variables → Actions → Variables** 添加：

- `VITE_AI_PROVIDER=http`
- `VITE_AI_ENDPOINT=https://你的-worker.workers.dev`
- 可选 `VITE_AI_TIMEOUT_MS=25000`

这些仍然只能是公开变量。服务端密钥只保存在 Worker Secret 中。

## 配置真实 AI 后端

`worker/` 是一个可独立部署的 Cloudflare Worker 示例。它会：

- 从 `OPENAI_API_KEY` 服务端 Secret 读取密钥
- 校验语言、解释层级和 12,000 字符上限
- 28 秒超时并返回清晰的 JSON 错误
- 仅允许 `ALLOWED_ORIGINS` 中的来源跨域访问
- 把代码包在“不可信代码”边界内，忽略注释和字符串中的提示词注入
- 不运行代码，也不访问代码中提到的 URL
- 要求模型使用严格 JSON Schema，并在转发给前端前再次校验关键字段

首次配置：

```bash
cd worker
pnpm install
pnpm exec wrangler login
pnpm exec wrangler secret put OPENAI_API_KEY
```

然后编辑 `worker/wrangler.toml`：

```toml
[vars]
ALLOWED_ORIGINS = "http://localhost:5173,https://你的用户名.github.io"
OPENAI_MODEL = "gpt-4o-mini"
```

本地调试与部署：

```bash
pnpm dev
pnpm deploy
```

部署后，把 Worker 地址配置成前端的 `VITE_AI_ENDPOINT`，把 provider 改为 `http`，再重新构建前端。

Worker 使用 OpenAI Responses API 的 Structured Outputs（`text.format` + strict JSON Schema）。具体字段和支持模型请以[官方 OpenAI Structured Outputs 文档](https://developers.openai.com/api/docs/guides/structured-outputs)为准。

## 返回数据

前端 provider 的统一返回类型位于 `src/types/explanation.ts`，核心形状如下：

```ts
interface ExplanationResult {
  summary: string
  flow: string[]
  steps: Array<{
    id: string
    title: string
    explanation: string
    detail: string
    lineStart: number
    lineEnd: number
    concepts: string[]
  }>
  concepts: Array<{ name: string; explanation: string }>
  warnings: Array<{ title: string; detail: string; severity: 'note' | 'caution' }>
  quiz: { question: string; options: string[]; answer: number; explanation: string }
}
```

即使后端返回缺失字段、错误行号或无效答案，`normalizeExplanation` 也会限制数量、修正范围并提供安全默认值。网络超时、非 JSON、非 2xx 和服务不可用都有独立错误提示。

## 安全与隐私

- 本项目只做静态解释，绝不执行用户粘贴的代码。
- Demo 模式不发送代码；HTTP 模式会把代码发送到你配置的 Worker。
- 前端明确提醒用户先删除密钥、密码、客户数据等敏感内容。
- 不要在 `.env*`、前端源码、GitHub Actions 变量或 `wrangler.toml` 中保存 API Key。
- `.gitignore` 会排除本地环境文件；密钥使用 `wrangler secret`。
- AI 解释可能遗漏或出错，界面不会把解释声明为确定事实。
- 面向公共产品时，建议在 Worker 前增加速率限制、滥用防护、日志脱敏与成本告警。

## 项目结构

```text
src/
  components/     界面组件
  config/         品牌与产品配置
  data/           内置示例
  providers/      Demo / HTTP provider
  types/          结构化解释类型
  utils/          语言识别、响应归一化与测试
worker/            Cloudflare Worker 示例
.github/workflows/ GitHub Pages 部署
```

## 当前限制

- Demo provider 是启发式规则，适合演示交互，不等同于真实语义分析。
- 语言自动识别是轻量规则，对很短或混合语言片段可能判断错误，用户可以手动切换。
- Worker 示例没有持久化用户代码，也没有内置账号系统、速率限制或计费控制。
- 当前只支持单文件静态解释，不理解整个仓库、依赖关系或运行时状态。
