-- 英文长篇 Markdown 正文填充脚本（面向海外技术招聘方的双语支持）。
-- 本脚本只把四段长篇中文技术案例正文翻译成专业英文，写入对应英文正文列：
--   1. project.content_markdown_en      slug = 'rebate-platform'       （十二渠道返利系统）
--   2. project.content_markdown_en      slug = 'quantitative-trading'  （日进斗金 ETF/期权盯盘）
--   3. ai_project.content_markdown_en   slug = 'ying-plus-ai'          （Ying+ AI 投资复盘）
--   4. ai_project.content_markdown_en   slug = 'fashion-item-matcher'  （穿搭同款搜索系统）
-- 幂等：每条 UPDATE 仅在英文列为空（IS NULL 或 '')时写入，绝不覆盖后台已填英文，可重复执行。
-- 其余较短项目（product-migration / realtime-risk-control / mango-campus）的英文正文已在 seed 中处理，本脚本不涉及。
-- 注意：Markdown 正文中的英文撇号（it's、company's、I'm 等）在 SQL 字符串中均以两个单引号 '' 转义。

-- ============================================================
-- 1. Multi-platform Rebate System  (project, slug = 'rebate-platform')
-- ============================================================
UPDATE project
SET content_markdown_en = '## Project Overview

> A monetization money-flow system that connects a "user click" to a "real payout": promotion links, user attribution, order feedback, commission calculation, fund payout and reverse claw-back across twelve external channels, all converged into a single model.

Rebate is a CPS distribution business. A user clicks a product on our site, jumps to an external channel to place an order, and days or weeks later the channel feeds the order back. The system then calculates the rebate based on continuously changing order states and pays it into the user''s balance. If any step in this chain fails silently, the end result is always that the user does not get paid.

I owned commission calculation and fund payout, the cross-channel attribution and link-conversion system, the channel onboarding framework, and the marketing campaigns built on top of the rebate pipeline.

| Dimension | Scale |
|---|---|
| Channels covered | 12 e-commerce and local-life channels, including multiple attribution systems and business lines within a single channel |
| Engineering structure | 8 Maven modules |
| Service interfaces | 48 client-facing interfaces and 7 internal RPC services |
| Async scheduling | 25 distributed jobs, of which 19 are channel-sync jobs and 6 are settlement and risk-control jobs |
| Data model | 21 core tables covering orders, message snapshots, after-sales claims, commission sharing, transfers, attribution, revenue aggregation and marketing campaigns |

## Business Challenges

### Channel semantics cannot be unified naturally

Different channels define commission, subsidy, service fee, claim deductions and settlement state differently. Some provide both estimated and actual commission, some have subsidies with an independent settlement state, some deduct a technical service fee first, and some cannot be back-calculated from a rate. The system must let channels keep their differences while preventing those differences from leaking into the end-to-end money flow.

### Orders have a long lifecycle

An order flows through "paid -> delivery confirmed -> pending settlement -> settled" over several weeks, with the commission recalculated throughout and possibly refunded at any point. The system must keep up with channel changes without mistaking an intermediate state for an unrecoverable terminal one.

### Every number is real money

Overpayment must be clawed back, underpayment triggers complaints, and duplicate payout becomes a financial loss. So every write, calculation and transfer must answer one question: if the same action runs again, is the result still correct?

## System Architecture

The whole pipeline is split into six stable stages, chained by hourly scheduling:

```text
Channel order sync
  -> Normalize channel messages into a unified order model
  -> Persist orders and snapshot the raw messages
  -> Real-time commission recalculation and forward/reverse commission records
  -> Fund payout, state update and arrival notification
  -> Refund claw-back, installment deduction and daily settlement reconciliation
```

Onboarding a new channel only requires adding implementations in the sync, cleaning, calculation and attribution layers, without modifying the existing core orchestration.

## Core Design Decisions

### 1. One calculation model to hold twelve pricing semantics

I separated "channel semantics" from "money flow" completely. The flow layer only decides whether an order is currently eligible for a rebate and how much it should be; each channel''s strategy independently handles field priority, subsidy thresholds, service fees and claim deductions.

All channels share the same upfront checks for risk control, refund state, commission-sharing state and ratio configuration. Amounts use "cents" as an integer unit across the whole chain, and ratio calculations round down consistently. When rules change, canary rollout is keyed on the order''s placement time rather than the current time, so recalculating a historical order does not drift.

### 2. Assume every step of the money flow may run twice

| Risk | Handling |
|---|---|
| Duplicate transfer | Write the transfer record first to obtain a business number, then call payment; retries reuse the same number |
| Concurrent order writes | Use an optimistic lock with a version number; skip directly when amount, state and completion time are unchanged |
| Multi-instance duplicate payout | The calculation, payout and claw-back stages each use a distributed lock with an expiry |
| Transactions affecting each other | The main money flow uses an independent transaction; marketing rewards are isolated in a new transaction |
| Early payout | A transfer is allowed only after the channel settlement cooldown and the risk-control check both pass |
| Over claw-back | A successful forward payout must exist, and the deduction cannot exceed the amount already paid |
| Insufficient balance | Installment deduction records are generated with an increasing sequence until the remaining amount converges |
| Infinite retries | A retry cap is set and wired into end-to-end exception alerting |

The commission-sharing state is converged into eight states, with forward, terminal and pending-deduction state sets defined in the enum, so the core flow is not littered with magic state values.

### 3. Fixing "a temporary failure conclusion permanently freezes a rebate"

To reduce redundant work, the calculation layer once reused an existing failure reason when it found one on an order; the settlement layer then wrote the calculation-failure text back onto the order. Combined, a temporary conclusion like "rebate ratio not yet configured" became permanent once persisted, and even after operations later filled in the configuration, historical orders were still never recalculated.

For long-lifecycle-order channels I explicitly removed this short-circuit and forced a recalculation from the latest state. I also removed the platform-wide terminal judgment of "zero commission means refunded," because a zero commission on an unsettled order is a normal state.

This issue produced a design principle for everything that followed: only a truly stable result may be cached; a failure result is treated as a mutable state by default.

### 4. Attribution correctness over surface-level availability

Link conversion must carry both the channel and the user attribution identifier. When user-identifier generation fails, degrading to a channel-only identifier still produces a usable link and a completable order, but the feedback cannot be matched to a site user, and the rebate is lost silently.

So attribution-identifier generation is fail-closed: if the identifier is unavailable, the conversion explicitly returns a failure so the user can notice and retry. Risk control uses the opposite strategy: only an explicit rejection blocks the rebate, because a temporarily failing risk-control service must not halt the whole site''s money flow.

The two choices look opposite but share one criterion: which failure mode is easier to detect, retry and compensate.

### 5. Isolating third-party orders in a shared promotion slot

While onboarding one channel, I found the promotion slot was not exclusive. If the attribution suffix collided with the third party''s value space, another business''s orders could be wrongly attributed to a site user and a real rebate paid out.

I redesigned the attribution-identifier format so the two value spaces do not overlap, and added local-ownership filtering on the order-sync side so third-party orders never enter persistence, message delivery or risk-control reporting. The isolation prefix is kept as a code constraint rather than an ordinary runtime config, to prevent a mistaken edit from stripping attribution off the entire existing order base.

## Engineering Governance

### Message snapshots as a write gate

Channel order snapshots use append-only, multi-version storage. Before processing, only the fields that affect order state and commission are compared; if the message has no business change, the write and recalculation are skipped.

One channel returned product line items in an unstable order, and the original signature concatenated them in traversal order, so messages with identical content were continuously judged as changed. I generated an entry per line item by content, sorted them and then signed, making the comparison independent of return order; fields that are out of sync with the main state and only add noise are explicitly excluded with a recorded reason.

### Migrating from OFFSET paging to cursor pagination

As orders grew, the OFFSET ceiling of the underlying middleware caused the scan job to fail. When migrating to cursor pagination, I additionally distinguished "whether the underlying layer read raw rows" from "whether there was a result after in-memory filtering": even if the filtered result is empty, as long as the underlying layer read data, the cursor keeps advancing, avoiding a job that finishes successfully while later orders are never scanned.

### Revenue aggregation and daily reconciliation

A user''s cumulative revenue is maintained by an atomic database increment, and a failed aggregation update does not block the main money flow. To resolve brief inconsistency, a daily job back-calculates from the real commission-sharing records and corrects them, scanning only users with recent fund changes, striking a balance between correctness and job cost.

### Bidirectional risk-control integration

Key nodes such as orders, commission sharing, payout and claw-back report to risk control asynchronously, and a delivery failure does not affect the main money-flow transaction. On the inbound side, a check is placed before both commission calculation and fund payout, with a compensation entry to recalculate historical orders after a risk-control misjudgment is lifted.

## Multi-channel Onboarding Framework

The stable identifier in the channel enum is used for the implementation package, the Bean prefix and channel routing at the same time. The core orchestration finds the matching implementation by convention, so onboarding a new channel only needs an implementation class and one enum entry, without modifying the existing dispatch logic.

On the attribution side, the site user and channel are combined into a channel identifier, with both forward and reverse mappings stored; channels with special authorization requirements are isolated through a dedicated adapter layer. On the product side, an intermediate model with agreed key names connects link conversion, display, product detail and guide persistence, so heterogeneous materials such as hot lists and high-commission items can reuse the same upstream display logic.

I led the from-scratch onboarding of two channels, covering product lists, product detail, product and arbitrary-link conversion, token parsing, campaign materials, and order and claim sync. The onboarding conclusions, production discrepancies and rejected approaches are all captured in handover docs to reduce the cost of future takeover and troubleshooting.

## Marketing Campaigns

On top of the core rebate pipeline I built campaigns such as multiplier cards, referral tasks, order lucky draws and newcomer subsidies. Taking the multiplier card as an example:

- The multiplier is snapshotted at grant time, so later changes to the campaign config do not affect historical rewards;
- Stock is decremented with an optimistic lock, and a per-order distributed lock prevents duplicate binding;
- On refund, the reward is unbound or clawed back based on its state;
- Installment deduction is supported when the balance is insufficient, and failed retries reuse the business number;
- A failed marketing-reward claw-back does not block the main commission claw-back; the two funds are isolated by risk priority.

## Project Results

- Twelve channels share one calculation, attribution and money-flow pipeline, and a new channel does not modify the existing core orchestration;
- Led two channels through from-scratch onboarding and production validation;
- The money flow has idempotency, optimistic locks, distributed locks, installment deduction, balance checks, a retry cap and end-to-end alerting;
- Fixed the defect where historical orders were permanently never rebated after the configuration was filled in, and the attribution-collision risk that could cause a financial loss;
- Migrated the scan pipeline to cursor pagination, removing the paging ceiling and avoiding the silent missed orders caused by an empty post-filter result;
- Reduced wasteful writes and ensured long-cycle fund consistency through snapshot comparison, revenue aggregation and daily reconciliation.

## Tech Stack

Java · Spring · MyBatis-Plus · MySQL · Redis · ZooKeeper · Message Queue · Distributed Scheduling · RPC · Dynamic Config Center

This is a public version. Channel names, third-party interface fields, internal systems and code structure, commission rates and specific business figures have all been omitted or desensitized.'
WHERE slug = 'rebate-platform'
  AND (content_markdown_en IS NULL OR content_markdown_en = '');

-- ============================================================
-- 2. Rising Fortune · ETF / Options Watcher  (project, slug = 'quantitative-trading')
-- ============================================================
UPDATE project
SET content_markdown_en = '## Project Overview

**Rising Fortune** is a cross-platform ETF / ETF-options desktop watcher for personal use, supporting macOS and Windows. It continuously collects market data, identifies market changes worth attention, and reminds the user to check the relevant instrument through system notifications, an in-app floating window and a tray entry.

The project is positioned as a **watching-and-alerting analysis tool, not an automated trading system**. Signals indicate "it is worth a look right now"; they do not place orders automatically, nor do they package historical statistics as deterministic returns.

- Repository: [trade_etf_watcher](https://github.com/Xin-Felix/trade_etf_watcher)
- Development: run Python modules directly, or package into a macOS App / Windows EXE via PyInstaller
- Data storage: market data, signals, option snapshots and local config are all stored in SQLite

## From Ying+ to a Local Watching Tool

Before Rising Fortune, I independently built **Ying+**, a multi-client personal investment app:

- [trade_ios](https://github.com/Xin-Felix/trade_ios): a SwiftUI + WidgetKit iOS client with code login, quotes, watchlist, K-lines and home-screen widgets;
- [trade_admin](https://github.com/Xin-Felix/trade_admin): a Vue 3 + TypeScript + Element Plus admin console for managing interfaces, jobs and data;
- [trade_backend](https://github.com/Xin-Felix/trade_backend): a FastAPI + PostgreSQL / TimescaleDB + Redis backend providing auth, quotes, factor data, scheduling and AI content.

Ying+ completed the multi-client technical chain, but continuing to promote it to the public would involve market-data licensing, product distribution and policy-compliance boundaries that a personal project cannot sustain, so I stopped productizing it. The code is kept as a multi-client architecture practice, with "launch and user growth" no longer a goal.

Afterwards I narrowed the requirement into a local desktop tool with no account system, no centralized data hosting and no public operation: solving only the watching, alerting and option-analysis problems I actually face every day. This trade-off moved the project from a "large, all-in-one investment platform" toward a well-bounded personal tool that I can fully deliver.

## Current Features

### Quotes and Charts

- TDX as the primary quote source and East Money as the backup, with a polling cycle of about 5 seconds;
- Automatically probes available nodes, switching and recovering after a connection failure;
- ECharts renders time-sharing, 1 / 5 / 15 / 30 / 60-minute and daily K-lines;
- Supports MA5 / MA10 / MA20, MACD, zoom, pan and a crosshair;
- K-lines open in a separate window, so they do not crowd the main watching panel.

### Market Signals

- 14 volume-price patterns, including volume-follow, volume-buildup launch, squeeze breakout and high-level breakdown;
- Intraday momentum provides an end-of-day direction reference at a fixed time;
- 8 anomaly alerts covering gaps, sharp rises and drops, rebound-from-bottom, pullback-from-high, minute-level changes, and IV and PCR anomalies;
- Each signal keeps its trigger reason and input data, so it can be reviewed rather than only showing "buy" or "sell".

### ETF Options Tools

- An option T-quote board covering 9 underlyings and 1200+ contracts;
- Shows bid/ask price and volume, implied volatility, Delta and open interest;
- Provides analysis pages such as volatility smile and surface, open-interest distribution and the IV term structure;
- Includes 7 strategy templates such as spread, straddle, butterfly and covered call;
- Uses Black-Scholes to compute theoretical price and the Greeks, and generates expiry payoff diagrams and time-decay tables;
- Saves a daily option snapshot to accumulate data for IV and open-interest history analysis.

### Notifications and Delivery

- macOS native notifications support jumping to the corresponding instrument''s K-line on click;
- The in-app floating window and the system tray provide the same jump path;
- The API key is configured via the GUI or a permission file under the user directory, never written into the repository or the installer;
- macOS App packaging and launch have been validated, and the Windows build config is ready.

## System Architecture

```text
TDX primary source / East Money backup / Tushare historical data
                ↓
       Background polling and trading calendar
                ↓
  K-line aggregation / volume-price patterns / intraday momentum / anomaly detection
        ↓                 ↓
SQLite quotes and signals   Option chain and daily snapshots
        ↓                 ↓
     PySide6 desktop shell + Vue 3 / ECharts pages
                ↓
      Native notifications / floating window / system tray
```

The GUI and the market-collection thread are separated: the background thread handles network requests, computation and persistence, while the main thread only receives immutable results via Qt Signals and updates the UI, so polling never blocks interaction. The front-end pages are built with Vue 3 + TypeScript and embedded in a QWebEngineView, with Python driving data rendering through a controlled bridge.

## Key Engineering Decisions

### 1. Dual data sources are not a simple failure retry

Quote interfaces produce unreachable nodes, intermittent single-IP rejections, temporarily empty fields and intraday data lag. The primary source probes available nodes at startup and records latency, reconnecting on a dropout; the backup source only rate-limits as a fallback when the primary is unavailable, so high-frequency requests do not trigger stricter limits.

Trading days, trading sessions and the lunch-break window are judged in a single calendar module, and all polling jobs reuse the same rules, so each data source does not interpret "should there be new data now" on its own.

### 2. Signals must be backtested, and failure conclusions must be published too

Volume-price patterns are not set by experience alone. I provided multi-instrument backtesting, parameter sweeps and feature-diagnosis tools for the rules, and included fees and benchmark returns in the validation.

The results show that some volume-price buy patterns have no positive expectation on the current single-stock sample, and that while the intraday momentum direction is statistically significant, the average per-trade magnitude of an instrument may be smaller than the bid-ask spread of ETF options. So the current version positions them as a direction reference and a manual-review reminder, not as a mechanical trading basis.

The project keeps these negative results, because "knowing where a rule does not work" matters more than only showing a few successful signals.

### 3. The option chain must reconcile real-time and historical semantics

Real-time T-quotes, minute K-lines, historical daily K-lines and contract metadata come from different interfaces, and their codes, expiry dates and price units are not naturally consistent. The system unifies contract coding, time and numeric semantics at the boundary layer, filters out all-zero K-lines produced by zero trades, and selects strategy legs within the same expiry month, so a cross-month combination does not distort the max profit/loss calculation.

Option snapshots are persisted per trading day, so volatility, open interest and the term structure can be compared across days rather than showing only the current instant.

### 4. AI capability must serve product trust

The project once implemented structured option-strategy suggestions based on DeepSeek, able to combine quotes, technicals, the option chain and historical movement to generate candidate strategies. After a product-boundary evaluation, the current UI actively removed this entry, while the underlying experimental code is kept.

The reason is that model output is easily misread as a deterministic trading suggestion, whereas a watching tool aims to present data, trigger alerts and assist human judgment. For a capability that cannot be reliably validated, I chose to pull it from the UI rather than keep displaying it just to "have AI".

### 5. Desktop packaging must account for two runtimes, Web and Qt

The app depends on Qt, WebEngine, ECharts and local Python modules at the same time. The PyInstaller config explicitly includes the WebEngine components, the front-end build artifacts and third-party data files; data arriving before the page finishes loading is first deduplicated and queued by render function, and the last copy is resent once the WebView is ready, so the first polling cycle at startup is not silently dropped.

## Project Results

- Completed the full chain from market collection, signal analysis, option tools, desktop UI and notifications to local packaging;
- Supports T-quotes and analysis for 9 ETF-options underlyings and 1200+ contracts;
- Built repeatable backtesting, parameter-sweep and data-diagnosis tools, and actively narrowed the signal usage based on negative results;
- The macOS version has been packaged and launch-validated, and Windows keeps a separate build config;
- Distilled the halted Ying+ multi-client practice into a clear technical evolution, rather than continuing to maintain a public platform that cannot be compliantly promoted.

## Tech Stack

Python 3.12 · PySide6 · Qt WebEngine · Vue 3 · TypeScript · ECharts · SQLite · pytdx · Tushare · akshare · PyInstaller

## Disclaimer

This project is for personal watching, data analysis and technical research only. Market data may be delayed or intermittently unavailable, historical statistics do not represent future performance, and no signal constitutes investment advice.'
WHERE slug = 'quantitative-trading'
  AND (content_markdown_en IS NULL OR content_markdown_en = '');

-- ============================================================
-- 3. Ying+ · AI Investment Review & Position Advice  (ai_project, slug = 'ying-plus-ai')
-- ============================================================
UPDATE ai_project
SET content_markdown_en = '## Project Overview

**Ying+ AI Investment Review & Position Advice** is the AI content subsystem inside the Ying+ multi-client personal investment app. Rather than handing raw market data straight to a model to "guess the direction," the backend first completes data sync, indicator computation, data validation and context compression, and then lets DeepSeek generate readable, traceable market content grounded in structured facts.

The system has three kinds of AI capability:

- **AI Morning Brief**: before each trading day, it generates a market overview combining the previous day''s market, international markets, sector fund flows, the limit-up ladder and hot concepts;
- **AI Daily Review**: after each close, it generates a personalized review combining the user''s holdings, watchlist, technicals, fund flows and market sentiment;
- **AI Position Advice**: for the holding structure, return rate, margin flags, trend and risk, it generates a position-management leaning and risk warnings.

The project has stopped productizing for the public, and is kept as a practice in AI content engineering, financial-data modeling and multi-client systems.

## Core Architecture

```text
Quotes / sectors / fund flows / holdings / watchlist / international markets
                       ↓
             Local database and data-sync jobs
                       ↓
       Context Builder: a unified, structured market context
                       ↓
  System Prompt + Context + Task Prompt three-layer input
                       ↓
                 DeepSeek generates Markdown
                       ↓
  Record state machine / back-office review and regeneration / user-side history
```

All AI features share one Context Builder: public market data is built once and reused across users; a user''s holdings and watchlist are queried per user. The model does not compute indicators such as MA, trend or fund flow — the backend computes and compresses them first and only hands structured conclusions to the model, reducing token consumption and improving output consistency.

## Delivered Capabilities

### 1. AI Morning Brief

The system automatically generates one market morning brief each trading-day morning, using the previous trading day''s closing data and overnight international-market performance, covering major indices, sector fund flows, the limit-up ladder, northbound capital, hot concepts and risk warnings.

Only one brief is generated per day, and the back office supports viewing, editing, manual generation and regeneration. International markets and local quotes are synced into the database in advance, so the AI generation stage does not call external data sources directly, avoiding interface latency blocking the job.

### 2. AI Daily Review

After each close, a holdings review is generated per user: the full market picture, the account''s return-rate distribution, the technicals and capital flow of key holdings, brief notes on watchlist stocks, hot topics and next-day risk points.

The review outputs only a return-rate percentage and never exposes a user''s holding amount in the model context or front-end content; each report is bound to a user, date and tier, with a unique constraint ensuring no duplicate generation on the same day.

### 3. AI Position Advice

Position advice reuses the market context, then adds the user''s holding cost, trend, margin flags, the last 5 days of K-lines, weekly K-lines and fund flows, outputting leanings such as add, hold, reduce or stop-loss along with position-concentration risk.

The model prompt forbids deterministic-return statements, target prices and full-position recommendations; every conclusion must be based on the input data and must clearly state risk boundaries and a disclaimer.

## Key Engineering Decisions

### Context Builder over prompt stacking

Model output quality depends on whether the input facts are complete and the semantics consistent. I split data processing into two layers: the public market Context is built once, and the per-user personalized Context is built separately; the context passes only compressed market conclusions and indicators, not large blocks of raw K-lines or tick data.

This both avoids redundant computation in the model and lets the morning brief, daily review and position advice reuse the same market facts, reducing token consumption and conclusion drift across features.

### When data is not ready, prefer to fail rather than generate a hollow report

Before an AI job runs, it checks whether A-share daily lines, indices, northbound capital, global markets and after-hours data have been synced. When core data is not ready, the job is recorded as failed with the reason preserved, instead of generating content that lacks key facts.

This principle fits the financial-content setting: a report that looks complete but lags on data is more dangerous than clearly telling the user "it cannot be generated for now."

### Idempotency, failure isolation and concurrency control

The daily review and position advice are unique by "user + report date," and the morning brief is unique by "report date." Job states are unified as pending, running, success and failed; regeneration updates the existing record rather than creating duplicate data.

Batch jobs use a semaphore to limit concurrent AI calls, and one user''s failure does not block others; the generation endpoint runs in a background thread, so a long model call does not hold an HTTP request thread.

### AI content must be reviewable and correctable

The back-office console can view the AI content, its data source and failure reason, and manually regenerate or edit it. Prompts, Context and job scheduling all keep clear boundaries, making it easy to trace "why the model produced this content" rather than treating the output as an unexplainable black box.

## Why Productization Was Stopped

Ying+ validated the technology across iOS, the admin console, the market-data service and the AI content system, but continuing to provide investment-related content to the public would involve long-term costs in market-data licensing, user operations, app distribution, AI-advice boundaries and policy compliance.

I chose to stop expanding after the project was complete: I will not package probabilistic model output as a deterministic investment service, nor keep acquiring users without long-term compliance and operational capability. I will converge my effort into the more clearly bounded local ETF / options watching tool.

The capabilities distilled from this experience are not lost: structured Context, data-readiness checks, job idempotency, cost control, back-office review and prompt boundaries remain the most important engineering foundations for building reliable AI applications.

## Related Repositories

- [Ying+ iOS client](https://github.com/Xin-Felix/trade_ios): a SwiftUI / WidgetKit client for quotes, watchlist and K-lines;
- [Ying+ admin console](https://github.com/Xin-Felix/trade_admin): a Vue 3 / TypeScript UI for jobs, data and AI content management;
- [Ying+ backend service](https://github.com/Xin-Felix/trade_backend): FastAPI, TimescaleDB, Redis, scheduling and AI content capabilities.

## Tech Stack

FastAPI · PostgreSQL · TimescaleDB · Redis · SQLAlchemy · Alembic · Vue 3 · TypeScript · DeepSeek · APScheduler · Docker

## Note

This case is for showcasing AI content engineering and financial-data systems; it does not provide an online investment-advice service and does not constitute investment advice.'
WHERE slug = 'ying-plus-ai'
  AND (content_markdown_en IS NULL OR content_markdown_en = '');

-- ============================================================
-- 4. Fashion Item Matcher  (ai_project, slug = 'fashion-item-matcher')
-- ============================================================
UPDATE ai_project
SET content_markdown_en = '## Project Background

This system serves content placement: given an influencer''s outfit photo, it splits out the fashion items within it, then retrieves the same or highly similar products from a product pool so the upstream can complete product selection and content assembly. It also provides text-to-item selection, content-style matching and pre-placement price validation.

The system is served with FastAPI, uses Elasticsearch to hold both vectors and scalar attributes, uses Kafka to drive incremental sync of products, SKUs, content and rebate flags, and uses multi-node embedding services and a cloud VLM to split images, tag, vectorize and rerank.

## My Responsibilities

The project was built by two people. I mainly owned the **vector index layer, the ingestion pipeline, price filtering, AI cost governance, data-operation tooling and the external interfaces**; ranking fusion, outfit joint selection and the evaluation platform were done collaboratively by the team and are not presented as my individual lead work.

## Core Work

### 1. Migrating the vector-retrieval foundation

The initial version stored vectors in Milvus and used CLIP for encoding, with limited effect on Chinese fashion semantics, and category, price and shop filtering still had to query back to the relational database, so recall and filtering semantics were hard to keep consistent.

I drove a migration to Qwen3-VL-Embedding and Elasticsearch dense_vector: image and text enter the same vector space, and the vector and scalar attributes land in the same document, so one kNN filter completes recall and business filtering together. The write side performs L2 normalization uniformly and uses dot product to reduce the repeated-normalization overhead of high-dimensional queries.

### 2. A nested multi-vector index

The old index used "one vector per product," keeping only the main item of a set and sharing one vector across multi-color SKUs, so secondary items in a set and exact color matching could not be recalled.

I designed an index structure with a product parent document plus SKU/single-item nested vectors: each single item stores an image vector, an attribute-text vector and item-level tags, so recall results are naturally deduplicated by product. For the issue where a nested kNN parent document''s score source is ambiguous, I use inner_hits to select the hit item whose category matches the query, and align the score, image, category and tags consistently into the downstream rerank chain; I also expand the recall categories for sets, so the filtering stage does not miss a target item inside a set.

### 3. An SKU-granularity vectorization pipeline

I helped build the full encoding chain from SKU data to the vector index:

1. Use an LLM to deduplicate same-item same-color SKUs, failing open on exceptions;
2. Group by image to avoid reprocessing SKUs that share an image;
3. For single items, select an image, crop the subject, apply item-level tagging and encode via the VLM;
4. For sets, split items guided by the title, then tag and encode each item;
5. Use each SKU''s own image and color anchor to fix category cross-contamination, color misjudgment and spec-text pollution.

After merging attribute tagging and the product short name into a single VLM call, the related calls at the ingestion stage were roughly halved.

### 4. Kafka CDC automated ingestion

I built four incremental consumer chains from scratch for products, SKUs, content and rebate-product flags. To handle the message storms produced by upstream bulk updates, I separated poll from business processing, and used a fixed worker pool and a semaphore to limit VLM and embedding concurrency; the same product uses task-level deduplication and pending compensation to ensure "no reburning the model, and no losing the latest state," and I disabled auto offset commit in favor of a manual commit with controllable processing progress.

A nested document can only be overwritten as a whole. To avoid a Kafka update wiping out an operator''s manual image change, pinning or soft-delete state, the write reads back the manual-state fields first and merges them, while distinguishing an operator''s manual deletion from a system auto-deletion, to prevent a delisted product from being silently restored by an incremental message.

### 5. Price-filtering system

I converged the platform price range, category rules and the operations exclusion list into a single judgment function, with the platform and category ranges intersected and the exclusion list unioned. The search chain applies the filter at three layers — ES recall, SKU selection and result assembly — and the external batch-validation interface reuses the same rules but uses a different risk semantics for "unknown price."

Price is judged at SKU granularity, with explicit integer price-bucket and decimal exact-match semantics, so the back-office config and the actually-effective rules do not diverge.

### 6. AI cost metering and governance

I built a dashboard of token details, daily aggregates and cost estimates split by model, stage and source, so the call costs of tagging, image splitting, denoising, image selection, reranking, query understanding and SKU deduplication can be tracked. Based on the metering, I switched high-frequency low-difficulty stages to lightweight models, bringing the related stage cost down to about **1/7** of the original; caching, SKU deduplication and merged calls further reduce repeated consumption.

I also made the statistical boundary explicit: abnormal or canceled calls may not fully reflect the real billing, so a consumer should not mistake the cost table for a source of model success-rate data.

### 7. Content retrieval and operations tooling

I built the content-style retrieval module from scratch, using a VLM to normalize gender, style, scene, season and tone, combined with vector recall, season-compatibility filtering and a degraded re-search when results are insufficient; I added a multi-grid and face-integrity check, and applied price filtering before random selection.

Alongside it I provided SKU image swap and rollback, listing/delisting and discard reasons, batch refresh with resumable checkpoints, data-sync interfaces, Feishu anomaly alerts, scheduled statistics and a runtime-config page, so index-quality issues can be found and fixed directly by operations.

## Key Challenges

- **Score attribution**: a nested kNN returns the parent document, and the actually-hit item must be aligned from inner_hits, otherwise you may get an end-to-end mismatch of "searching for pants but reranking with the top of a set";
- **Manual-state protection**: a whole-document overwrite that succeeds but quietly restores a deleted product is a silent failure with no error, so the manual state must be explicitly merged before the write;
- **Message storms**: a burst of CDC simultaneously occupying the VLM and embedding can drag down the main service, requiring concurrency limits, task deduplication, pending compensation and reliable offsets together;
- **Config visibility**: environment variables, the database and code defaults form a multi-layer priority, so the states of "overridden, read-only or restart-required" must be visible in the back office, to avoid a save that succeeds but does not actually take effect.

## Project Results

- The product pool reached **120k+**, maintaining **210k+ SKU vectors** and **20k+ content vectors**;
- The multi-vector index effectively covers **50k+ products**, supporting recall of secondary items in a set and multi-color SKUs, and completed the decommissioning of the single-vector legacy chain;
- After merging tagging and the short name in the ingestion chain, the related VLM calls were roughly halved;
- After switching stages such as denoising, image selection and classification to lightweight models, cost dropped to about **1/7** of the original;
- Content-placement filtering reached a **91.5%** pass rate in sampled validation, and responses retain filter details for issue localization.

The figures above are phased project statistics rounded to public-facing granularity; the page does not show internal system names, Topics, keys, interface addresses or specific business figures.

## Tech Stack

Python · FastAPI · Elasticsearch · Kafka · Redis · MySQL · Vue 3 · Qwen3-VL-Embedding · VLM · DeepSeek'
WHERE slug = 'fashion-item-matcher'
  AND (content_markdown_en IS NULL OR content_markdown_en = '');
