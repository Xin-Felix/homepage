-- 将 Ying+ 的 AI 内容能力迁移为独立 AI Lab 项目。
-- 首先只删除本次未提交默认文案对应的普通项目，避免触碰后台已手动编辑的同名项目。

DELETE FROM project
WHERE slug = 'ying-plus'
  AND name = 'Ying+ · 多端个人投资应用'
  AND description = '独立开发的多端个人投资应用，覆盖 SwiftUI iOS 客户端、Vue 3 管理后台与 FastAPI 数据服务，完成邮箱登录、行情、自选、K 线、桌面组件、任务调度和数据管理。项目完成多端链路验证后，因行情数据授权、分发与合规边界停止继续产品化。'
  AND role = '独立开发者'
  AND period = '2026.07 — 2026.08'
  AND content_markdown LIKE '%本案例用于展示多端架构与工程实践，不提供在线投资服务，也不构成投资建议。%';

INSERT INTO ai_project (
    sort_order, visible, title, slug, summary, status, models, stack,
    demo_url, repo_url, content_markdown
)
SELECT
    COALESCE((SELECT MAX(existing_project.sort_order) FROM ai_project existing_project), 0) + 1,
    TRUE,
    'Ying+ · AI 投资复盘与仓位建议',
    'ying-plus-ai',
    'Ying+ 多端个人投资应用中的 AI 内容工程实践：将市场、板块、持仓与自选数据构建为结构化 Context，基于 DeepSeek 生成 AI 晨报、每日复盘和仓位建议，并提供数据就绪校验、幂等生成、后台审阅与权限计费链路。项目已停止继续产品化，作为 AI 应用工程与金融数据系统实践保留。',
    'ARCHIVED',
    'DeepSeek / Tushare / 本地行情数据',
    'FastAPI
PostgreSQL / TimescaleDB
Redis
Vue 3 / TypeScript
DeepSeek
APScheduler
Context Builder
AI 内容工程',
    NULL,
    'https://github.com/Xin-Felix/trade_backend',
    '## 项目概览

**Ying+ AI 投资复盘与仓位建议** 是 Ying+ 多端个人投资应用中的 AI 内容子系统。它不是把原始行情直接交给模型“猜涨跌”，而是先由后端完成数据同步、指标计算、数据校验和上下文压缩，再让 DeepSeek 基于结构化事实生成可阅读、可追溯的市场内容。

系统包含三类 AI 能力：

- **AI 晨报**：每日交易日前，结合上一交易日市场、国际市场、板块资金、涨停梯队和热点概念生成市场概览；
- **AI 每日复盘**：每日盘后结合用户持仓、自选、技术面、资金流和市场情绪生成个性化复盘；
- **AI 仓位建议**：针对持仓结构、收益率、融资标记、趋势与风险，生成仓位管理倾向和风险提示。

项目已停止继续面向公众产品化，仍作为 AI 内容工程、金融数据建模和多端系统实践保留。

## 核心架构

```text
行情 / 板块 / 资金流 / 持仓 / 自选 / 国际市场
                       ↓
             本地数据库与数据同步任务
                       ↓
       Context Builder：统一结构化市场上下文
                       ↓
  System Prompt + Context + Task Prompt 三层输入
                       ↓
                 DeepSeek 生成 Markdown
                       ↓
  记录状态机 / 后台审阅与重生成 / 用户端历史查看
```

所有 AI 功能共享一套 Context Builder：市场公共数据只构建一次，多个用户复用；用户持仓和自选数据按用户单独查询。模型不负责计算 MA、趋势或资金流等指标，后端先完成计算和压缩，只将结构化结论交给模型，减少 Token 消耗并提高输出一致性。

## 已实现能力

### 1. AI 晨报

系统在每个交易日早晨自动生成一条市场晨报，使用上一交易日收盘数据和隔夜国际市场表现，覆盖主要指数、板块资金流向、涨停梯队、北向资金、热点概念和风险提示。

晨报每天只生成一条，后台支持查看、编辑、手动生成和重新生成。国际市场和本地行情均提前同步入库，AI 生成阶段不直接调用外部数据源，避免接口延迟阻塞任务。

### 2. AI 每日复盘

每日盘后为用户生成持仓复盘：市场全貌、账户收益率分布、重点持仓技术面与资金面、自选股简评、热点和次日风险点。

复盘只输出收益率百分比，不在模型上下文或前端内容中暴露用户持仓金额；每份报告绑定用户、日期和等级，使用唯一约束保证同一天不会重复生成。

### 3. AI 仓位建议

仓位建议复用市场上下文，再补充用户持仓成本、趋势、融资标记、近 5 日 K 线、周线和资金流，输出加仓、持有、减仓或止损等倾向性建议及仓位集中度风险。

模型提示词禁止确定性收益表述、目标价和满仓建议；所有结论必须基于输入数据，并明确风险边界和免责声明。

## 关键工程判断

### Context Builder 优先于 Prompt 堆叠

模型输出质量取决于输入事实是否完整、口径是否一致。我将数据处理分为两层：公共市场 Context 只构建一次，用户个性化 Context 单独构建；上下文只传递压缩后的市场结论与指标，不传大段原始 K 线或逐笔数据。

这样既避免模型重复计算，也让晨报、复盘和仓位建议复用同一份市场事实，降低 Token 消耗和不同功能之间的结论漂移。

### 数据未就绪时宁可失败，不生成空洞报告

AI 任务运行前检查 A 股日线、指数、北向资金、全球市场和盘后数据是否已经同步。核心数据未就绪时，任务记录为失败并保留原因，而不是生成缺少关键事实的内容。

这条原则与金融内容场景一致：一份看似完整但数据滞后的报告，比明确告诉用户“暂时不可生成”更危险。

### 幂等、失败隔离与并发控制

每日复盘和仓位建议以“用户 + 报告日期”为唯一维度，晨报以“报告日期”为唯一维度。任务状态统一为 pending、running、success 和 failed；重新生成更新已有记录，不重复创建数据。

批量任务使用信号量限制并发 AI 调用，单个用户失败不会阻断其他用户；生成接口进入后台线程执行，避免长时间模型调用占住 HTTP 请求线程。

### AI 内容需要可审阅、可修正

后台管理端可以查看 AI 内容、对应数据源、失败原因并手动重新生成或编辑。Prompt、Context 和任务调度都保留清晰边界，方便回溯“模型为什么会给出这段内容”，而不是把输出当成不可解释的黑盒。

## 为什么停止继续产品化

Ying+ 完成了 iOS、管理后台、行情数据服务和 AI 内容系统的技术验证，但继续面向公众提供投资相关内容，会长期涉及行情数据授权、用户运营、应用分发、AI 建议边界和政策合规成本。

我选择在项目完成后停止继续扩张：不把概率性模型输出包装为确定性投资服务，也不在没有长期合规与运营能力的前提下继续获取用户。后续将精力收敛到边界更清晰的本地 ETF / 期权盯盘工具中。

这段经历沉淀出的能力并没有丢失：结构化 Context、数据就绪校验、任务幂等、成本控制、后台审阅和提示词边界，仍然是构建可靠 AI 应用时最重要的工程基础。

## 关联仓库

- [Ying+ iOS 客户端](https://github.com/Xin-Felix/trade_ios)：SwiftUI / WidgetKit 的行情、自选和 K 线客户端；
- [Ying+ 管理后台](https://github.com/Xin-Felix/trade_admin)：Vue 3 / TypeScript 的任务、数据与 AI 内容管理界面；
- [Ying+ 后端服务](https://github.com/Xin-Felix/trade_backend)：FastAPI、TimescaleDB、Redis、调度和 AI 内容能力。

## 技术栈

FastAPI · PostgreSQL · TimescaleDB · Redis · SQLAlchemy · Alembic · Vue 3 · TypeScript · DeepSeek · APScheduler · Docker

## 说明

本案例用于展示 AI 内容工程和金融数据系统实践，不提供在线投资建议服务，也不构成投资建议。'
WHERE NOT EXISTS (
    SELECT 1
    FROM ai_project existing_project
    WHERE existing_project.slug = 'ying-plus-ai'
       OR existing_project.title = 'Ying+ · AI 投资复盘与仓位建议'
);
