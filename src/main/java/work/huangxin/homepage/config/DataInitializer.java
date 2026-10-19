package work.huangxin.homepage.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import work.huangxin.homepage.domain.ContactLink;
import work.huangxin.homepage.domain.Experience;
import work.huangxin.homepage.domain.Profile;
import work.huangxin.homepage.domain.Project;
import work.huangxin.homepage.domain.SortableEntity;
import work.huangxin.homepage.repository.ContactLinkRepository;
import work.huangxin.homepage.repository.ExperienceRepository;
import work.huangxin.homepage.repository.ProfileRepository;
import work.huangxin.homepage.repository.ProjectRepository;

/**
 * 首次启动（数据库里还没有 profile）时写入主页初始内容。
 * 内容提炼自个人简历；之后都在后台修改，不会被再次覆盖。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final ProfileRepository profileRepository;
    private final ExperienceRepository experienceRepository;
    private final ProjectRepository projectRepository;
    private final ContactLinkRepository contactLinkRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (profileRepository.existsById(Profile.SINGLETON_ID)) {
            return;
        }
        log.info("首次启动，写入初始主页内容");

        Profile profile = new Profile();
        profile.setName("黄鑫");
        profile.setSiteTitle("黄鑫 · Java 后端工程师 / 核心系统研发");
        profile.setDescription("黄鑫的个人主页：4 年+ Java 后端经验，专注商业化、实时风控、复杂系统迁移与稳定性治理。");
        profile.setKeywords("黄鑫, Java, 后端工程师, Spring Boot, 分布式系统, 实时风控, 商业化系统, 稳定性治理");
        profile.setGreeting("你好，我是");
        profile.setIntro("Java 后端工程师，4 年+ 核心业务系统经验。专注商业化、实时风控与复杂系统迁移，关注稳定性、可扩展性和工程效率。");
        profile.setTags(new ArrayList<>(List.of(
                "Java", "Spring Boot", "分布式系统", "MySQL", "Docker", "Python", "风控系统", "稳定性治理")));
        profile.setAbout("软件工程本科，现居杭州。长期负责互联网核心业务系统设计与维护，覆盖商品、商家、营销玩法、商业化资金链路和实时风控。\n"
                + "擅长在高并发、业务变化频繁和资源受限的环境中完成架构拆解、稳定性治理与跨团队交付。做过 15,000+ 商品无中断迁移、实时风控系统外部交付，以及多平台返利核心计算模块。\n"
                + "工作之外持续维护开源项目和量化交易系统。相信简单直接的代码，以及可稳定演进的长期主义。");
        profile.setFooterText("黄鑫 · huangxin.work");
        profile.setMessageEnabled(true);
        profileRepository.save(profile);

        saveInOrder(experienceRepository, List.of(
                Experience.of("2022.04 — 至今", "Java 后端工程师", "蘑菇街",
                        "负责商品、商家、营销玩法及商业化核心能力建设，覆盖入驻审核、抽奖发奖、会员日和资金链路；参与实时风控系统交接与稳定性治理，建设限流、熔断、降级及异常隔离能力，并承担跨团队复杂系统支援与交付。"),
                Experience.of("2021.04 — 2021.09", "全栈开发工程师", "腾讯",
                        "使用 Python 独立开发内部安全平台并参与云产品安全问题修复；参与 CI/CD 流水线建设，使用 Docker、跳板机及企业级 Git 规范完成交付。"),
                Experience.of("2020.11 — 2021.01", "全栈开发工程师", "西安旭瑞视讯智能科技有限公司",
                        "参与后台管理、智能摄像头控制及视频会议系统建设，负责 Nginx 推拉流控制，接触 WebRTC、RTMP 等音视频协议与业务架构。")));

        saveInOrder(projectRepository, List.of(
                Project.of("多平台返利体系", "",
                        "负责商业化资金链路核心返利模块，从计算模型、逆向退款扣回到差异化规则配置进行模块化设计。通过可配置策略与通用接口支持多平台快速接入，并与资金、风控及中台团队完成全链路可追溯和稳定性保障。",
                        List.of("核心模块负责人", "Java / Spring Boot", "资金链路", "2024.11 — 至今")),
                Project.of("商品系统迁移", "",
                        "下沉支援高风险核心商品链路迁移，设计异构商品模型映射、兼容层、新老系统双写及灰度切换方案；完成 15,000+ 商品与类目、外部映射数据迁移，实现迁移过程零重大事故、零业务中断。",
                        List.of("技术负责人", "双写 / 灰度", "15,000+ 商品", "2025.05 — 2025.08")),
                Project.of("实时风控系统拆分与对外输出", "",
                        "将公司内部实时风控能力拆分为可独立交付的工程产品，完成规则引擎、特征平台、决策模块及数据与消息依赖解耦，提供 SDK、部署迁移、灰度回滚、压力测试和标准化接入文档。",
                        List.of("核心系统负责人", "实时风控", "系统拆分 / SDK", "2024.08 — 2024.10")),
                Project.of("Mango", "https://github.com/Xin-Felix/Mango",
                        "从零开发的开源校园社区微信小程序，包含表白墙、失物招领、二手交易、论坛和拼车等模块，完整经历上线、运营与归档周期。",
                        List.of("⭐ 开源", "Java / 微信小程序", "Spring Boot / MyBatis", "2020 — 2024")),
                Project.of("量化交易系统", "https://github.com/Xin-Felix/QuantitativeTrading",
                        "自建股票量化系统：接入 tushare 数据源，以 ClickHouse 存储全量分钟 K 数据，开发选股因子与早晚报推送能力。",
                        List.of("Python", "ClickHouse", "数据工程", "个人长期项目"))));

        saveInOrder(contactLinkRepository, List.of(
                ContactLink.of("GitHub", "github.com/Xin-Felix", "https://github.com/Xin-Felix"),
                ContactLink.of("Email", "1538933906@qq.com", "mailto:1538933906@qq.com"),
                ContactLink.of("微信", "1538933906（请注明来意）", null)));
    }

    private static <T extends SortableEntity> void saveInOrder(JpaRepository<T, Long> repository, List<T> items) {
        for (int i = 0; i < items.size(); i++) {
            items.get(i).setSortOrder(i + 1);
        }
        repository.saveAll(items);
    }
}
