package work.huangxin.homepage.auth;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import lombok.extern.slf4j.Slf4j;
import work.huangxin.homepage.common.ClientIp;
import work.huangxin.homepage.config.HomepageProperties;

/**
 * 固定管理员账号登录：用户名和密码只在登录时提交，验证成功后换取随机 token。
 * 后续后台请求使用 {@code Authorization: Bearer <token>}，token 仅保存在服务端内存并自动过期。
 */
@Slf4j
@Service
public class AdminAuthService {

    private static final String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final String DEVELOPMENT_USERNAME = "admin";
    private static final int MAX_USERNAME_LENGTH = 100;

    private final SecureRandom random = new SecureRandom();
    private final byte[] usernameDigest;
    private final byte[] passwordDigest;
    private final Duration tokenTtl;
    private final Cache<String, Instant> tokens;

    public AdminAuthService(HomepageProperties properties, Environment environment) {
        boolean production = environment.acceptsProfiles(Profiles.of("prod"));
        String username = normalizeUsername(properties.admin().username());
        String password = properties.admin().password();

        if (!StringUtils.hasText(username)) {
            if (production) {
                throw new IllegalStateException("生产环境必须通过环境变量 ADMIN_USERNAME 设置后台账号");
            }
            username = DEVELOPMENT_USERNAME;
            log.warn("未配置后台账号（环境变量 ADMIN_USERNAME），开发环境账号：{}", username);
        }
        if (username.length() > MAX_USERNAME_LENGTH) {
            throw new IllegalStateException("后台账号不能超过 " + MAX_USERNAME_LENGTH + " 个字符");
        }
        if (!StringUtils.hasText(password)) {
            if (production) {
                throw new IllegalStateException("生产环境必须通过环境变量 ADMIN_PASSWORD 设置后台密码");
            }
            password = randomPassword(16);
            log.warn("未配置后台密码（环境变量 ADMIN_PASSWORD），本次启动的临时密码：{}", password);
        } else if (password.length() < 12) {
            log.warn("后台密码少于 12 位，建议换一个更长的密码");
        }

        this.usernameDigest = ClientIp.sha256(username);
        this.passwordDigest = ClientIp.sha256(password);
        this.tokenTtl = properties.admin().tokenTtl();
        this.tokens = Caffeine.newBuilder()
                .expireAfterWrite(tokenTtl)
                .maximumSize(1_000)
                .build();
    }

    /**
     * 同时校验用户名和密码。两项摘要总会全部计算和比较，避免用响应时间枚举用户名。
     */
    public Optional<LoginResult> login(String username, String password) {
        byte[] candidateUsername = ClientIp.sha256(normalizeUsername(username));
        byte[] candidatePassword = ClientIp.sha256(password == null ? "" : password);
        boolean usernameMatches = MessageDigest.isEqual(usernameDigest, candidateUsername);
        boolean passwordMatches = MessageDigest.isEqual(passwordDigest, candidatePassword);
        if (!(usernameMatches & passwordMatches)) {
            return Optional.empty();
        }

        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant expiresAt = Instant.now().plus(tokenTtl);
        tokens.put(token, expiresAt);
        return Optional.of(new LoginResult(token, expiresAt));
    }

    public boolean isValid(String token) {
        if (!StringUtils.hasText(token)) {
            return false;
        }
        Instant expiresAt = tokens.getIfPresent(token);
        return expiresAt != null && expiresAt.isAfter(Instant.now());
    }

    public void logout(String token) {
        if (StringUtils.hasText(token)) {
            tokens.invalidate(token);
        }
    }

    /** 从 Authorization 头里取 Bearer token。 */
    public static String extractToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return null;
        }
        return authorizationHeader.substring("Bearer ".length()).trim();
    }

    private static String normalizeUsername(String username) {
        return username == null ? "" : username.trim();
    }

    private String randomPassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(PASSWORD_CHARS.charAt(random.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }

    public record LoginResult(String token, Instant expiresAt) {
    }
}
