package work.huangxin.homepage.config;

import java.nio.charset.StandardCharsets;
import java.util.List;

import javax.sql.DataSource;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.DatabasePopulatorUtils;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import work.huangxin.homepage.domain.Profile;
import work.huangxin.homepage.repository.ProfileRepository;

/**
 * 在 Hibernate 建表后执行 SQL 内容初始化。
 * 新库先执行完整 seed；后续脚本只做幂等新增或带旧值条件的更新，不覆盖后台自定义内容。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private static final String SEED_SCRIPT = "db/homepage-seed.sql";
    private static final List<String> CONTENT_UPDATE_SCRIPTS = List.of(
            "db/content-updates/2026-10-resume-refresh.sql",
            "db/content-updates/2026-10-fashion-item-matcher-ai.sql",
            "db/content-updates/2026-10-rebate-case-study.sql",
            "db/content-updates/2026-10-trading-tools-case-study.sql",
            "db/content-updates/2026-10-ying-plus-ai-project.sql",
            // 英文内容填充：放在所有中文内容脚本之后，仅在英文列为空时写入，不覆盖后台已填英文。
            "db/content-updates/2026-10-english-core-fields.sql",
            "db/content-updates/2026-10-english-markdown.sql");

    private final ProfileRepository profileRepository;
    private final DataSource dataSource;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!profileRepository.existsById(Profile.SINGLETON_ID)) {
            log.info("首次启动，从 SQL 写入主页初始内容");
            execute(SEED_SCRIPT);
        }

        for (String script : CONTENT_UPDATE_SCRIPTS) {
            execute(script);
        }
    }

    private void execute(String classpathLocation) {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.setSqlScriptEncoding(StandardCharsets.UTF_8.name());
        populator.addScript(new ClassPathResource(classpathLocation));
        DatabasePopulatorUtils.execute(populator, dataSource);
    }
}
