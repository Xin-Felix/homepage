package work.huangxin.homepage.config;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import work.huangxin.homepage.domain.Note;
import work.huangxin.homepage.repository.NoteRepository;

/** 首次启用技术笔记模块时写入两篇可在后台继续修改的工程实践初稿。 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NoteInitializer {

    private final NoteRepository noteRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initialize() {
        if (noteRepository.count() > 0) return;
        noteRepository.saveAll(List.of(
                note("复杂系统迁移：双写、对账与灰度切换", "system-migration-double-write",
                        "一次低风险迁移通常不是一条脚本，而是一套可观察、可暂停、可回退的工程过程。",
                        List.of("系统迁移", "双写", "灰度"), """
                                ## 迁移真正困难的部分

                                系统迁移不只是把历史数据从 A 搬到 B。只要业务还在运行，就必须同时处理持续写入、模型差异、依赖方切换和异常恢复。

                                ## 我通常拆成五个阶段

                                1. **模型映射**：明确字段转换、默认值和无法直接映射的数据；
                                2. **存量回灌**：任务支持分片、断点续传和幂等重试；
                                3. **增量双写**：让新数据同时进入两套系统，并持续对账；
                                4. **灰度读流量**：按业务维度逐步切换，保留快速回退开关；
                                5. **观察与收口**：确认差异、延迟和异常都处于可接受范围后再下线旧链路。

                                ## 对账比迁移脚本更重要

                                对账需要覆盖数量、关键字段、关联关系和业务结果。只比较总行数通常不够，真正危险的是“数据存在但语义不一致”。

                                ## 回退能力

                                迁移开始前就应该回答：如果某一步出现问题，能否停止、能否重放、能否切回旧系统。把回退当成方案的一部分，而不是事故发生后的临时操作。
                                """),
                note("实时风控系统拆分时，我关注什么", "realtime-risk-control-boundaries",
                        "把内部风控能力变成可独立部署的产品，核心不是复制代码，而是重新定义边界。",
                        List.of("实时风控", "系统拆分", "稳定性"), """
                                ## 先识别隐性依赖

                                内部系统往往默认存在配置中心、消息队列、用户体系、监控平台和运维工具。拆分前需要把这些隐性假设逐项列出，否则外部环境中的第一个问题通常不是业务逻辑，而是系统无法启动或无法排查。

                                ## 稳定接口，隔离实现

                                对外暴露的应该是稳定输入、决策结果和可解释的错误，而不是内部服务结构。存储、消息和配置差异放在适配层，规则执行和决策主流程保持一致。

                                ## 交付物不只有代码

                                一个可交付系统至少还需要：

                                - 环境检查和自动化部署说明；
                                - SDK 与标准接入示例；
                                - 配置变更、灰度和回滚流程；
                                - 指标、日志和问题排查手册；
                                - 压力测试与故障演练结果。

                                ## 可追溯性

                                风控决策需要能够回答“当时使用了什么规则、什么特征、为什么得到这个结果”。因此版本、输入摘要和决策链路必须在拆分过程中保留下来。
                                """)));
        log.info("已写入技术笔记初始内容");
    }

    private static Note note(String title, String slug, String summary, List<String> tags, String markdown) {
        Note note = new Note();
        note.setTitle(title);
        note.setSlug(slug);
        note.setSummary(summary);
        note.setTags(new ArrayList<>(tags));
        note.setContentMarkdown(markdown);
        note.setPublished(true);
        note.setPublishedAt(LocalDateTime.now());
        return note;
    }
}
