-- 为已有数据库填充英文列（面向海外求职的双语支持）。
-- 只在对应英文列为空时写入；后台手动填过的英文不会被覆盖，重复执行幂等。
-- 这里覆盖"招聘方第一眼看到"的核心字段：个人信息、经历、项目/AI 卡片与摘要；
-- 长篇 Markdown 正文的英文在 2026-10-english-markdown.sql 单独处理。

-- ===== Profile 个人信息 =====
UPDATE profile
SET name_en = 'Huang Xin',
    site_title_en = 'Huang Xin · Java Backend Engineer / Core Systems',
    description_en = 'Huang Xin — Java backend engineer with 4+ years building monetization money-flow, payment integration, real-time risk control, large-scale system migration and reliability engineering.',
    keywords_en = 'Huang Xin, Java, Backend Engineer, Spring Boot, Distributed Systems, Real-time Risk Control, Payment Systems, Monetization, Reliability Engineering',
    greeting_en = 'Hi, I''m',
    intro_en = 'Java backend engineer with 4+ years on core business systems. I focus on monetization money-flow, payment integration, real-time risk control and complex system migration, with an eye on reliability, scalability and engineering efficiency.',
    tags_en = 'Java
Spring Boot
Distributed Systems
MySQL
Docker
Python
Real-time Risk Control
Payment Systems
Reliability Engineering',
    about_en = 'BSc in Software Engineering, based in Hangzhou, China. I have long owned the design and maintenance of core internet business systems spanning products, merchants, marketing campaigns, monetization money-flow, payment integration and real-time risk control.
I work well in high-concurrency, fast-changing and resource-constrained environments, breaking down architecture, driving reliability and delivering across teams. I have run a zero-downtime migration of 15,000+ products, delivered a real-time risk-control system to external environments, and owned the core calculation module of a multi-platform rebate system.
Outside work I keep maintaining open-source projects and a quantitative-trading system, and I explore engineering AI into content generation, decision support and internal tooling. I believe in simple, direct code and long-term, steadily evolving systems.',
    footer_text_en = 'Huang Xin · huangxin.work'
WHERE id = 1
  AND (name_en IS NULL OR name_en = '');

-- ===== Experience 经历 =====
UPDATE experience
SET period_en = '2022.04 — Present',
    role_en = 'Java Backend Engineer',
    org_en = 'Mogujie',
    description_en = 'Owned product, merchant, marketing-campaign, monetization money-flow and payment capabilities — including merchant onboarding review, lucky-draw payouts, membership days, Google Pay and hybrid payment integration. Took over and stabilized a real-time risk-control system, building rate limiting, circuit breaking, graceful degradation and fault isolation, and supported complex cross-team system delivery.'
WHERE role = 'Java 后端工程师' AND org = '蘑菇街'
  AND (role_en IS NULL OR role_en = '');

UPDATE experience
SET period_en = '2021.04 — 2021.09',
    role_en = 'Full-stack Engineer',
    org_en = 'Tencent',
    description_en = 'Independently built an internal security platform in Python and helped fix security issues in cloud products. Contributed to the CI/CD pipeline, delivering with Docker, bastion hosts and enterprise Git conventions.'
WHERE role = '全栈开发工程师' AND org = '腾讯'
  AND (role_en IS NULL OR role_en = '');

UPDATE experience
SET period_en = '2020.11 — 2021.01',
    role_en = 'Full-stack Engineer',
    org_en = 'Xi''an Xurui Vision Intelligent Technology',
    description_en = 'Worked on admin management, smart-camera control and video-conferencing systems, handling Nginx push/pull streaming and working with audio/video protocols such as WebRTC and RTMP and their business architecture.'
WHERE role = '全栈开发工程师' AND org = '西安旭瑞视讯智能科技有限公司'
  AND (role_en IS NULL OR role_en = '');

-- ===== Project 项目卡片与摘要（含已升级版本）=====
-- 返利（已升级为十二渠道完整案例）
UPDATE project
SET name_en = 'Multi-platform Rebate System',
    role_en = 'Core Module Owner',
    period_en = '2024.11 — Present',
    description_en = 'Owned the core rebate pipeline across twelve e-commerce and local-life channels, unifying promotion link conversion, user attribution, order feedback reconciliation, commission calculation, fund payout and reverse claw-back. Through channel-strategy onboarding, fund idempotency, distributed scheduling and daily settlement reconciliation, long-cycle asynchronous orders became traceable and compensable, with low-cost onboarding of new channels.',
    meta_en = 'Core Module Owner
Java / Spring
Distributed Scheduling
12 Channels
Money-flow
2024.11 — Present'
WHERE slug = 'rebate-platform'
  AND (name_en IS NULL OR name_en = '');

-- 商品系统迁移
UPDATE project
SET name_en = 'Product System Migration',
    role_en = 'Technical Lead',
    period_en = '2025.05 — 2025.08',
    description_en = 'Led a high-risk migration of the core product pipeline, keeping compatibility across multiple categories, SKUs, virtual goods, membership goods and external product mappings. Designed model mapping, old/new product identifiers, dual-write reconciliation and canary cutover, migrating 15,000+ products and related data with zero major incidents and zero business interruption.',
    meta_en = 'Technical Lead
Dual-write / Canary
15,000+ Products
2025.05 — 2025.08'
WHERE slug = 'product-migration'
  AND (name_en IS NULL OR name_en = '');

-- 实时风控
UPDATE project
SET name_en = 'Real-time Risk Control: Decoupling & External Delivery',
    role_en = 'Core System Owner',
    period_en = '2024.08 — 2024.10',
    description_en = 'Turned the company''s internal real-time risk-control capability into an independently deliverable engineering product. Decoupled the rule engine, feature platform and decision modules from data and messaging dependencies, and provided an SDK, deployment/migration, canary rollback, load testing and standardized onboarding docs.',
    meta_en = 'Core System Owner
Real-time Risk Control
Decoupling / SDK
2024.08 — 2024.10'
WHERE slug = 'realtime-risk-control'
  AND (name_en IS NULL OR name_en = '');

-- Mango 开源校园社区
UPDATE project
SET name_en = 'Mango',
    role_en = 'Solo Developer',
    period_en = '2020 — 2024',
    description_en = 'An open-source campus community WeChat Mini Program built from scratch, with modules for a confession wall, lost & found, second-hand trading, forums and carpooling. It went through a full launch, operation and archival lifecycle.',
    meta_en = '⭐ Open Source
Java / WeChat Mini Program
Spring Boot / MyBatis
2020 — 2024'
WHERE slug = 'mango-campus'
  AND (name_en IS NULL OR name_en = '');

-- 日进斗金 ETF/期权盯盘（slug 仍为 quantitative-trading）
UPDATE project
SET name_en = 'Rising Fortune · ETF / Options Watcher',
    role_en = 'Solo Developer',
    period_en = '2026.10 — Present',
    description_en = 'A self-built cross-platform (macOS / Windows) desktop watcher for ETFs and ETF options, combining dual-source real-time quotes, multi-timeframe K-lines, volume-price patterns, intraday momentum, an option T-quote board and strategy analysis, with native notifications and local data storage. It evolved from the earlier Ying+ multi-client investment app and was narrowed into a local alerting tool to respect market-data licensing and compliance boundaries.',
    meta_en = '⭐ Open Source
Python / PySide6
Vue 3 / ECharts
ETF / ETF Options
Cross-platform Desktop
2026.10 — Present'
WHERE slug = 'quantitative-trading'
  AND (name_en IS NULL OR name_en = '');

-- ===== AI Lab 项目卡片与摘要 =====
UPDATE ai_project
SET title_en = 'Fashion Item Matcher',
    summary_en = 'A same-item retrieval system for fashion, built for content placement. I owned the vector index layer, the Kafka CDC ingestion pipeline, price filtering and AI cost governance. Built on FastAPI, Elasticsearch nested dense_vector and multimodal models, it serves image-to-item, text-to-item and content-style matching over 120k+ products and 210k+ SKU vectors.',
    models_en = 'Qwen3-VL-Embedding-2B / Cloud VLM / DeepSeek',
    stack_en = 'Python
FastAPI
Elasticsearch dense_vector
Kafka
Redis
Vue 3
Qwen3-VL-Embedding
VLM
DeepSeek'
WHERE slug = 'fashion-item-matcher'
  AND (title_en IS NULL OR title_en = '');

UPDATE ai_project
SET title_en = 'Ying+ · AI Investment Review & Position Advice',
    summary_en = 'The AI content engineering practice inside the Ying+ multi-client investment app: market, sector, holdings and watchlist data are turned into a structured Context, and DeepSeek generates an AI morning brief, daily review and position advice, with data-readiness checks, idempotent generation, back-office review and a permission/billing flow. Productization has stopped; it is kept as a record of AI application engineering and financial-data systems.',
    models_en = 'DeepSeek / Tushare / Local market data',
    stack_en = 'FastAPI
PostgreSQL / TimescaleDB
Redis
Vue 3 / TypeScript
DeepSeek
APScheduler
Context Builder
AI Content Engineering'
WHERE slug = 'ying-plus-ai'
  AND (title_en IS NULL OR title_en = '');

-- ===== Contact 联系方式 =====
UPDATE contact_link SET label_en = 'GitHub', text_en = 'github.com/Xin-Felix'
WHERE label = 'GitHub' AND (label_en IS NULL OR label_en = '');

UPDATE contact_link SET label_en = 'Email', text_en = '1538933906@qq.com'
WHERE label = 'Email' AND (label_en IS NULL OR label_en = '');

UPDATE contact_link SET label_en = 'WeChat', text_en = '1538933906 (please note your purpose)'
WHERE label = '微信' AND (label_en IS NULL OR label_en = '');
