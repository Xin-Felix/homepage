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
 * 后台登录。
 * <p>
 * 原项目是命令行 AdminPanel 每次请求都把明文密码放进 Authorization 头；
 * 这里改成：密码只在登录时提交一次，换取一个随机 token（内存保存、有过期时间），
 * 之后后台请求带 {@code Authorization: Bearer <token>}。
 */
@Slf4j
@Service
public class AdminAuthService {

    private static final String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

    private final SecureRandom random = new SecureRandom();
    private final byte[] passwordDigest;
    private final Duration tokenTtl;
    private final Cache<String, Instant> tokens;

    public AdminAuthService(HomepageProperties properties, Environment environment) {
        String password = properties.admin().password();
        if (!StringUtils.hasText(password)) {
            if (environment.acceptsProfiles(Profiles.of("prod"))) {
                throw new IllegalStateException("生产环境必须通过环境变量 ADMIN_PASSWORD 设置后台密码");
            }
            password = randomPassword(16);
            log.warn("未配置后台密码（环境变量 ADMIN_PASSWORD），本次启动的临时密码：{}", password);
        } else if (password.length() < 8) {
            log.warn("后台密码少于 8 位，建议换一个更长的密码");
        }
        this.passwordDigest = ClientIp.sha256(password);
        this.tokenTtl = properties.admin().tokenTtl();
        this.tokens = Caffeine.newBuilder()
                .expireAfterWrite(tokenTtl)
                .maximumSize(1_000)
                .build();
    }

    /** 校验密码，成功返回新 token。 */
    public Optional<LoginResult> login(String password) {
        if (password == null) {
            return Optional.empty();
        }
        // 比较摘要 + 常量时间比较，避免时序侧信道
        if (!MessageDigest.isEqual(passwordDigest, ClientIp.sha256(password))) {
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
