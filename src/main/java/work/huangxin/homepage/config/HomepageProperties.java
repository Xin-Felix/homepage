package work.huangxin.homepage.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * 自定义配置项，前缀 homepage.*，见 application.yml。
 */
@ConfigurationProperties(prefix = "homepage")
public record HomepageProperties(
        @DefaultValue Admin admin,
        @DefaultValue RateLimit rateLimit,
        @DefaultValue Views views,
        @DefaultValue Notification notification) {

    /**
     * @param password 后台登录密码，建议通过环境变量 ADMIN_PASSWORD 注入
     * @param tokenTtl 登录态有效期
     */
    public record Admin(String password, @DefaultValue("12h") Duration tokenTtl) {
    }

    /**
     * @param capacity       普通接口：每个 IP 在 period 内可消耗的令牌数
     * @param period         普通接口令牌补充周期
     * @param loginFailures  每个 IP 在 loginPeriod 内允许的登录失败次数
     * @param loginPeriod    登录失败计数周期
     * @param messages       每个 IP 在 messagePeriod 内允许的留言条数
     * @param messagePeriod  留言计数周期
     */
    public record RateLimit(
            @DefaultValue("600") long capacity,
            @DefaultValue("30s") Duration period,
            @DefaultValue("5") long loginFailures,
            @DefaultValue("5m") Duration loginPeriod,
            @DefaultValue("5") long messages,
            @DefaultValue("10m") Duration messagePeriod) {
    }

    /**
     * @param uniqueWindow  同一 IP 再次计数前需要等待的时间
     * @param maxTrackedIps 内存中最多保留的 IP 摘要数量
     */
    public record Views(
            @DefaultValue("24h") Duration uniqueWindow,
            @DefaultValue("100000") long maxTrackedIps) {
    }

    /**
     * @param email 收到新留言时通知到的邮箱，留空则不发送邮件
     * @param from  发件人地址；配置了 spring.mail.username 时优先用它（多数邮箱要求发件人与登录账号一致）
     */
    public record Notification(String email, String from) {
    }
}
