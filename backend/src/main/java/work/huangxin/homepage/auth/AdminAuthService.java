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

/** 固定管理员账号、密码和可选 TOTP 的完整认证；全部通过后才签发 token。 */
@Slf4j
@Service
public class AdminAuthService {

    private static final String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final String DEVELOPMENT_USERNAME = "admin";
    private static final int MAX_USERNAME_LENGTH = 100;
    private static final int MAX_PASSWORD_LENGTH = 200;

    private final SecureRandom random = new SecureRandom();
    private final byte[] usernameDigest;
    private final byte[] passwordDigest;
    private final Duration tokenTtl;
    private final Cache<String, Instant> tokens;
    private final AdminTotpService totpService;

    public AdminAuthService(HomepageProperties properties, Environment environment, AdminTotpService totpService) {
        this.totpService = totpService;
        boolean production = environment.acceptsProfiles(Profiles.of("prod"));
        String username = normalizeUsername(properties.admin().username());
        String password = properties.admin().password();

        if (!StringUtils.hasText(username)) {
            if (production) throw new IllegalStateException("生产环境必须通过 ADMIN_USERNAME 设置后台账号");
            username = DEVELOPMENT_USERNAME;
            log.warn("未配置 ADMIN_USERNAME，开发环境账号：{}", username);
        }
        if (username.length() > MAX_USERNAME_LENGTH) {
            throw new IllegalStateException("后台账号不能超过 " + MAX_USERNAME_LENGTH + " 个字符");
        }
        if (!StringUtils.hasText(password)) {
            if (production) throw new IllegalStateException("生产环境必须通过 ADMIN_PASSWORD 设置后台密码");
            password = randomPassword(16);
            log.warn("未配置 ADMIN_PASSWORD，本次启动的临时密码：{}", password);
        } else if (password.length() < 12) {
            log.warn("后台密码少于 12 位，建议换一个更长的密码");
        }

        this.usernameDigest = ClientIp.sha256(username);
        this.passwordDigest = ClientIp.sha256(password);
        this.tokenTtl = properties.admin().tokenTtl();
        this.tokens = Caffeine.newBuilder().expireAfterWrite(tokenTtl).maximumSize(1_000).build();
    }

    /** 用户名、密码和 TOTP 在同一次登录尝试中完成；TOTP 未启用时 code 可为空。 */
    public Optional<LoginResult> login(String username, String password, String code) {
        boolean primaryMatches = verifyPrimary(username, password);
        // 即使主凭据错误，也读取并校验 TOTP 状态，但不会消费有效时间步，减少时序差异。
        boolean totpMatches = totpService.verifyForLogin(code, primaryMatches);
        if (!(primaryMatches & totpMatches)) return Optional.empty();
        return Optional.of(issueToken());
    }

    public boolean verifyPassword(String password) {
        String bounded = password != null && password.length() <= MAX_PASSWORD_LENGTH ? password : "";
        return MessageDigest.isEqual(passwordDigest, ClientIp.sha256(bounded));
    }

    public boolean isValid(String token) {
        if (!StringUtils.hasText(token)) return false;
        Instant expiresAt = tokens.getIfPresent(token);
        return expiresAt != null && expiresAt.isAfter(Instant.now());
    }

    public void logout(String token) {
        if (StringUtils.hasText(token)) tokens.invalidate(token);
    }

    /** 启用或停用 TOTP 后撤销全部旧会话，强制按新认证策略重新登录。 */
    public void invalidateAllTokens() {
        tokens.invalidateAll();
    }

    public static String extractToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) return null;
        return authorizationHeader.substring("Bearer ".length()).trim();
    }

    private boolean verifyPrimary(String username, String password) {
        String normalizedUsername = normalizeUsername(username);
        String boundedUsername = normalizedUsername.length() <= MAX_USERNAME_LENGTH ? normalizedUsername : "";
        String boundedPassword = password != null && password.length() <= MAX_PASSWORD_LENGTH ? password : "";
        byte[] candidateUsername = ClientIp.sha256(boundedUsername);
        byte[] candidatePassword = ClientIp.sha256(boundedPassword);
        boolean usernameMatches = MessageDigest.isEqual(usernameDigest, candidateUsername);
        boolean passwordMatches = MessageDigest.isEqual(passwordDigest, candidatePassword);
        return usernameMatches & passwordMatches;
    }

    private LoginResult issueToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant expiresAt = Instant.now().plus(tokenTtl);
        tokens.put(token, expiresAt);
        return new LoginResult(token, expiresAt);
    }

    private static String normalizeUsername(String username) {
        return username == null ? "" : username.trim();
    }

    private String randomPassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) sb.append(PASSWORD_CHARS.charAt(random.nextInt(PASSWORD_CHARS.length())));
        return sb.toString();
    }

    public record LoginResult(String token, Instant expiresAt) {}
}
