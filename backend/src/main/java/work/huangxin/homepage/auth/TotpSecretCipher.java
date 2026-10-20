package work.huangxin.homepage.auth;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import work.huangxin.homepage.common.ClientIp;
import work.huangxin.homepage.config.HomepageProperties;

/** AES-256-GCM secret 加解密；每次加密使用独立 96-bit nonce 和用途绑定 AAD。 */
@Component
public class TotpSecretCipher {

    private static final int NONCE_BYTES = 12;
    private static final int TAG_BITS = 128;
    private final SecureRandom random = new SecureRandom();
    private final SecretKeySpec key;
    private final String keyId;

    public TotpSecretCipher(HomepageProperties properties, Environment environment) {
        String configured = properties.totp().encryptionKey();
        boolean production = environment.acceptsProfiles(Profiles.of("prod"));
        if (!StringUtils.hasText(configured) && production) {
            throw new IllegalStateException("生产环境必须配置 TOTP_ENCRYPTION_KEY");
        }
        byte[] keyBytes = StringUtils.hasText(configured)
                ? decodeKey(configured.trim())
                : ClientIp.sha256("homepage-development-totp-key");
        if (keyBytes.length != 32) {
            throw new IllegalStateException("TOTP_ENCRYPTION_KEY 必须是 32 字节（64 位 hex 或 Base64）");
        }
        this.key = new SecretKeySpec(keyBytes, "AES");
        this.keyId = properties.totp().keyId();
    }

    public EncryptedSecret encrypt(String secret, String purpose) {
        byte[] nonce = new byte[NONCE_BYTES];
        random.nextBytes(nonce);
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, nonce));
            cipher.updateAAD(aad(purpose));
            byte[] ciphertext = cipher.doFinal(secret.getBytes(StandardCharsets.UTF_8));
            ByteBuffer payload = ByteBuffer.allocate(nonce.length + ciphertext.length).put(nonce).put(ciphertext);
            return new EncryptedSecret(Base64.getUrlEncoder().withoutPadding().encodeToString(payload.array()), keyId);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("TOTP secret 加密失败", e);
        }
    }

    public String decrypt(String encoded, String storedKeyId, String purpose) {
        if (!keyId.equals(storedKeyId)) {
            throw new IllegalStateException("无法识别 TOTP 加密 key id：" + storedKeyId);
        }
        try {
            byte[] payload = Base64.getUrlDecoder().decode(encoded);
            if (payload.length <= NONCE_BYTES) throw new GeneralSecurityException("密文长度不正确");
            byte[] nonce = new byte[NONCE_BYTES];
            byte[] ciphertext = new byte[payload.length - NONCE_BYTES];
            System.arraycopy(payload, 0, nonce, 0, NONCE_BYTES);
            System.arraycopy(payload, NONCE_BYTES, ciphertext, 0, ciphertext.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, nonce));
            cipher.updateAAD(aad(purpose));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            throw new IllegalStateException("TOTP secret 解密或完整性校验失败", e);
        }
    }

    private byte[] aad(String purpose) {
        return ("homepage-totp|" + keyId + "|" + purpose + "|1").getBytes(StandardCharsets.UTF_8);
    }

    private static byte[] decodeKey(String configured) {
        if (configured.matches("^[0-9a-fA-F]{64}$")) return HexFormat.of().parseHex(configured);
        try {
            return Base64.getDecoder().decode(configured);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("TOTP_ENCRYPTION_KEY 不是有效的 hex 或 Base64", e);
        }
    }

    public record EncryptedSecret(String ciphertext, String keyId) {
    }
}
