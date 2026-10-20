package work.huangxin.homepage.auth;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.OptionalLong;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.exception.ConflictException;
import work.huangxin.homepage.config.HomepageProperties;
import work.huangxin.homepage.domain.AdminTotpCredential;
import work.huangxin.homepage.repository.AdminTotpCredentialRepository;

/** TOTP 设置、确认、登录校验和防重放状态。 */
@Service
@RequiredArgsConstructor
public class AdminTotpService {

    private final AdminTotpCredentialRepository repository;
    private final TotpSecretCipher cipher;
    private final TotpCodeService codeService;
    private final TotpQrCodeService qrCodeService;
    private final HomepageProperties properties;

    @Transactional(readOnly = true)
    public TotpStatus status() {
        AdminTotpCredential credential = repository.findById(AdminTotpCredential.SINGLETON_ID).orElse(null);
        boolean pending = credential != null && StringUtils.hasText(credential.getPendingCiphertext())
                && credential.getPendingExpiresAt() != null
                && credential.getPendingExpiresAt().isAfter(LocalDateTime.now());
        return new TotpStatus(credential != null && credential.isEnabled(), pending);
    }

    @Transactional
    public TotpSetup startSetup() {
        AdminTotpCredential credential = lockedCredential();
        if (credential.isEnabled()) {
            throw new ConflictException("TOTP 已启用，请先验证并停用后再重新绑定");
        }
        String secret = codeService.generateSecret();
        TotpSecretCipher.EncryptedSecret encrypted = cipher.encrypt(secret, "pending");
        credential.setPendingCiphertext(encrypted.ciphertext());
        credential.setPendingKeyId(encrypted.keyId());
        credential.setPendingExpiresAt(LocalDateTime.now().plus(properties.totp().pendingTtl()));
        repository.save(credential);

        String uri = otpauthUri(secret);
        return new TotpSetup(secret, credential.getPendingExpiresAt(), qrCodeService.dataUrl(uri));
    }

    @Transactional
    public boolean confirmIfValid(String code) {
        AdminTotpCredential credential = lockedCredential();
        if (!pendingValid(credential)) {
            clearPending(credential);
            throw new ConflictException("TOTP 绑定已过期，请重新生成二维码");
        }
        String secret = cipher.decrypt(credential.getPendingCiphertext(), credential.getPendingKeyId(), "pending");
        OptionalLong step = codeService.matchStep(secret, code);
        if (step.isEmpty()) return false;

        TotpSecretCipher.EncryptedSecret active = cipher.encrypt(secret, "active");
        credential.setActiveCiphertext(active.ciphertext());
        credential.setActiveKeyId(active.keyId());
        credential.setEnabled(true);
        credential.setLastAcceptedStep(step.getAsLong());
        clearPending(credential);
        return true;
    }

    /**
     * 登录校验始终读取 TOTP 状态。primaryCredentialsValid=false 时只做等价校验、不消费时间步，
     * 避免错误密码抢占有效验证码造成拒绝服务。
     */
    @Transactional
    public boolean verifyForLogin(String code, boolean primaryCredentialsValid) {
        AdminTotpCredential credential = repository.findByIdForUpdate(AdminTotpCredential.SINGLETON_ID).orElse(null);
        if (credential == null || !credential.isEnabled()) return true;
        if (!StringUtils.hasText(credential.getActiveCiphertext())) {
            throw new IllegalStateException("TOTP 已启用但凭据不完整");
        }
        String secret = cipher.decrypt(credential.getActiveCiphertext(), credential.getActiveKeyId(), "active");
        OptionalLong matched = codeService.matchStep(secret, code);
        if (matched.isEmpty()) return false;
        if (!primaryCredentialsValid) return true;
        if (matched.getAsLong() <= credential.getLastAcceptedStep()) return false;
        credential.setLastAcceptedStep(matched.getAsLong());
        return true;
    }

    @Transactional
    public boolean disableIfValid(String code, boolean passwordValid) {
        AdminTotpCredential credential = repository.findByIdForUpdate(AdminTotpCredential.SINGLETON_ID)
                .orElseThrow(() -> new ConflictException("TOTP 尚未启用"));
        if (!credential.isEnabled()) throw new ConflictException("TOTP 尚未启用");
        String secret = cipher.decrypt(credential.getActiveCiphertext(), credential.getActiveKeyId(), "active");
        OptionalLong matched = codeService.matchStep(secret, code);
        boolean codeValid = matched.isPresent() && matched.getAsLong() > credential.getLastAcceptedStep();
        if (!(passwordValid & codeValid)) return false;
        credential.setEnabled(false);
        credential.setActiveCiphertext(null);
        credential.setActiveKeyId(null);
        credential.setLastAcceptedStep(-1L);
        clearPending(credential);
        return true;
    }

    private AdminTotpCredential lockedCredential() {
        return repository.findByIdForUpdate(AdminTotpCredential.SINGLETON_ID).orElseGet(() -> {
            AdminTotpCredential created = new AdminTotpCredential();
            return repository.saveAndFlush(created);
        });
    }

    private boolean pendingValid(AdminTotpCredential credential) {
        return StringUtils.hasText(credential.getPendingCiphertext())
                && credential.getPendingExpiresAt() != null
                && credential.getPendingExpiresAt().isAfter(LocalDateTime.now());
    }

    private static void clearPending(AdminTotpCredential credential) {
        credential.setPendingCiphertext(null);
        credential.setPendingKeyId(null);
        credential.setPendingExpiresAt(null);
    }

    private String otpauthUri(String secret) {
        String issuer = properties.totp().issuer();
        String username = properties.admin().username();
        String label = encode(issuer + ":" + username);
        return "otpauth://totp/" + label
                + "?secret=" + secret
                + "&issuer=" + encode(issuer)
                + "&algorithm=SHA1&digits=6&period=" + properties.totp().period().toSeconds();
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    public record TotpStatus(boolean enabled, boolean setupPending) {
    }

    public record TotpSetup(String manualKey, LocalDateTime expiresAt, String qrDataUrl) {
    }
}
