package work.huangxin.homepage.config;

import java.nio.charset.StandardCharsets;

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
 * 新库只执行完整 seed；已有库只执行带旧值前置条件的幂等内容更新，不覆盖后台自定义内容。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private static final String SEED_SCRIPT = "db/homepage-seed.sql";
    private static final String RESUME_REFRESH_SCRIPT = "db/content-updates/2026-10-resume-refresh.sql";

    private final ProfileRepository profileRepository;
    private final DataSource dataSource;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!profileRepository.existsById(Profile.SINGLETON_ID)) {
            log.info("首次启动，从 SQL 写入主页初始内容");
            execute(SEED_SCRIPT);
        }

        // 脚本只匹配仓库上一版默认文案；管理员已经改过的行不会命中。
        execute(RESUME_REFRESH_SCRIPT);
    }

    private void execute(String classpathLocation) {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.setSqlScriptEncoding(StandardCharsets.UTF_8.name());
        populator.addScript(new ClassPathResource(classpathLocation));
        DatabasePopulatorUtils.execute(populator, dataSource);
    }
}
