package work.huangxin.homepage.config;

import java.util.Map;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import work.huangxin.homepage.domain.Project;
import work.huangxin.homepage.repository.ProjectRepository;

/**
 * 为升级前已有项目补充一次性案例详情。仅处理 slug 为空的已知项目，
 * 后续管理员修改、取消发布或重写 Markdown 都不会被启动过程覆盖。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProjectDetailInitializer {

    private final ProjectRepository projectRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initialize() {
        int updated = 0;
        for (Project project : projectRepository.findAll()) {
            ProjectSeed seed = SEEDS.get(project.getName());
            if (seed == null || StringUtils.hasText(project.getSlug())) {
                continue;
            }
            project.setSlug(seed.slug());
            project.setRole(seed.role());
            project.setPeriod(seed.period());
            project.setContentMarkdown(seed.markdown());
            project.setDetailPublished(true);
            updated++;
        }
        if (updated > 0) {
            log.info("已为 {} 个已有项目补充案例详情", updated);
        }
    }

    private static final Map<String, ProjectSeed> SEEDS = Map.of(
            "多平台返利体系", new ProjectSeed("rebate-platform", "核心模块负责人", "2024.11 — 至今", """
                    ## 项目背景

                    公司需要统一不同平台、用户和库存条件下的返利计算。原有能力分散在多条业务链路中，规则扩展、逆向退款和问题追踪成本较高。

                    ## 核心挑战

                    - 不同平台的返利口径、预算和扣减规则存在差异；
                    - 正向计算与退款扣回必须保持一致和可追溯；
                    - 新平台接入不能持续复制整套资金链路；
                    - 资金、风控及业务中台需要共同参与核对。

                    ## 我的工作

                    我负责核心计算模块的设计、开发与上线，将返利过程拆分为规则匹配、金额计算、结果落库和逆向扣回等稳定边界。通过策略配置和通用接口隔离平台差异，并补充计算快照、幂等标识和链路日志。

                    ## 方案要点

                    1. **统一计算模型**：把活动、用户、库存和平台条件收敛为标准输入；
                    2. **策略化扩展**：平台差异通过配置与策略实现，避免主流程分支膨胀；
                    3. **正逆向一致**：退款基于原始计算快照执行扣回，避免规则变化影响历史订单；
                    4. **可观测性**：关键决策和资金变化可按订单追踪，便于跨团队核对。

                    ## 项目结果

                    核心模块能够支撑多个平台快速接入，返利规则扩展成本和线上排查成本明显降低。出于业务保密要求，页面不展示具体资金规模和内部系统名称。
                    """),
            "商品系统迁移", new ProjectSeed("product-migration", "技术负责人", "2025.05 — 2025.08", """
                    ## 项目背景

                    核心商品链路需要从原有商品模型迁移到新的系统。链路同时连接前后台、类目、库存和多项外部映射，任何数据偏差都可能直接影响交易。

                    ## 核心挑战

                    - 新旧商品模型并非一一对应；
                    - 迁移期间业务仍在持续写入；
                    - 需要支持灰度、核对、快速回退和断点续传；
                    - 多系统之间必须保持最终一致。

                    ## 我的工作

                    我负责迁移方案和核心链路落地，设计模型映射与兼容层，并组织新老系统双写、历史数据回灌、差异核对和分阶段切流。

                    ## 迁移步骤

                    1. 建立字段映射、默认值和异常数据处理规则；
                    2. 上线双写与对账，持续观察新旧数据差异；
                    3. 分批迁移商品、类目和外部映射数据；
                    4. 通过灰度开关逐步切换读流量；
                    5. 保留回退能力，确认稳定后完成收口。

                    ## 项目结果

                    完成 **15,000+ 商品**及相关类目、映射数据迁移，迁移过程保持业务连续，未发生重大线上事故。
                    """),
            "实时风控系统拆分与对外输出", new ProjectSeed("realtime-risk-control", "核心系统负责人", "2024.08 — 2024.10", """
                    ## 项目背景

                    原实时风控能力深度依赖公司内部基础设施，需要拆分成可以在外部环境独立部署和交付的工程产品。

                    ## 核心挑战

                    - 规则引擎、特征平台和决策流程存在内部依赖；
                    - 消息、存储和配置中心需要适配不同部署环境；
                    - 外部交付必须具备安装、迁移、灰度和回滚方案；
                    - 风控链路对延迟、稳定性和可追溯性要求较高。

                    ## 我的工作

                    我负责系统边界梳理、依赖解耦和交付方案，将内部服务拆分为标准接口和可配置适配层，并提供接入 SDK、部署文档、压力测试及故障演练方案。

                    ## 稳定性设计

                    - 核心接口设置超时、限流、熔断和降级；
                    - 异常消息隔离并支持补偿重放；
                    - 关键决策保留版本、输入摘要和结果链路；
                    - 配置变更支持灰度发布和快速回滚。

                    ## 项目结果

                    系统从“内部能力”升级为可独立部署和标准化接入的工程产品，降低了外部环境适配和后续维护成本。
                    """),
            "Mango", new ProjectSeed("mango-campus", "独立开发者", "2020 — 2024", """
                    ## 项目简介

                    Mango 是我在校期间从零开发的开源校园社区，包含表白墙、失物招领、二手交易、论坛和拼车等模块。

                    ## 技术实现

                    - 微信小程序前端；
                    - Spring Boot + MyBatis 后端；
                    - MySQL 数据存储；
                    - 内容发布、评论、通知和后台管理等完整链路。

                    ## 收获

                    这个项目让我完整经历了需求分析、数据建模、接口设计、上线运行、用户反馈和项目归档。代码目前保留用于学习参考。
                    """),
            "量化交易系统", new ProjectSeed("quantitative-trading", "独立开发者", "个人长期项目", """
                    ## 项目简介

                    自建股票量化研究系统，用于沉淀行情数据、因子实验和每日观察结果。

                    ## 技术实现

                    - 使用 Python 处理数据采集和研究任务；
                    - 接入 tushare 数据源；
                    - 使用 ClickHouse 保存全量分钟 K 线；
                    - 开发选股因子和早晚报推送能力。

                    ## 当前状态

                    项目持续迭代中，主要服务个人研究。后续会逐步补充回测、任务编排和可观测性说明。
                    """));

    private record ProjectSeed(String slug, String role, String period, String markdown) {
    }
}
