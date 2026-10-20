package work.huangxin.homepage.auth;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.OptionalLong;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Component;

import work.huangxin.homepage.config.HomepageProperties;

/** RFC 6238 TOTP：HMAC-SHA1、6 位、默认 30 秒，兼容主流 Authenticator。 */
@Component
public class TotpCodeService {

    private static final char[] BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".toCharArray();
    private final SecureRandom random = new SecureRandom();
    private final long periodSeconds;
    private final int allowedWindow;

    public TotpCodeService(HomepageProperties properties) {
        this.periodSeconds = properties.totp().period().toSeconds();
        this.allowedWindow = properties.totp().allowedWindow();
        if (periodSeconds <= 0 || allowedWindow < 0 || allowedWindow > 2) {
            throw new IllegalStateException("TOTP period/window 配置不合法");
        }
    }

    public String generateSecret() {
        byte[] bytes = new byte[20];
        random.nextBytes(bytes);
        return encodeBase32(bytes);
    }

    public OptionalLong matchStep(String secret, String inputCode) {
        String code = inputCode == null ? "" : inputCode.replace(" ", "").trim();
        if (!code.matches("^\\d{6}$")) return OptionalLong.empty();
        long current = Instant.now().getEpochSecond() / periodSeconds;
        for (int offset = -allowedWindow; offset <= allowedWindow; offset++) {
            long step = current + offset;
            String expected = code(secret, step);
            if (MessageDigest.isEqual(expected.getBytes(StandardCharsets.US_ASCII), code.getBytes(StandardCharsets.US_ASCII))) {
                return OptionalLong.of(step);
            }
        }
        return OptionalLong.empty();
    }

    private static String code(String base32Secret, long step) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(decodeBase32(base32Secret), "HmacSHA1"));
            byte[] hash = mac.doFinal(ByteBuffer.allocate(8).putLong(step).array());
            int offset = hash[hash.length - 1] & 0x0f;
            int binary = ((hash[offset] & 0x7f) << 24)
                    | ((hash[offset + 1] & 0xff) << 16)
                    | ((hash[offset + 2] & 0xff) << 8)
                    | (hash[offset + 3] & 0xff);
            return String.format("%06d", binary % 1_000_000);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("无法计算 TOTP", e);
        }
    }

    private static String encodeBase32(byte[] data) {
        StringBuilder out = new StringBuilder((data.length * 8 + 4) / 5);
        int buffer = 0, bits = 0;
        for (byte value : data) {
            buffer = (buffer << 8) | (value & 0xff);
            bits += 8;
            while (bits >= 5) {
                out.append(BASE32[(buffer >> (bits - 5)) & 31]);
                bits -= 5;
            }
        }
        if (bits > 0) out.append(BASE32[(buffer << (5 - bits)) & 31]);
        return out.toString();
    }

    private static byte[] decodeBase32(String value) {
        String normalized = value.replace("=", "").replace(" ", "").toUpperCase();
        byte[] out = new byte[normalized.length() * 5 / 8];
        int buffer = 0, bits = 0, index = 0;
        for (char c : normalized.toCharArray()) {
            int digit = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".indexOf(c);
            if (digit < 0) throw new IllegalArgumentException("无效 Base32 secret");
            buffer = (buffer << 5) | digit;
            bits += 5;
            if (bits >= 8) {
                out[index++] = (byte) ((buffer >> (bits - 8)) & 0xff);
                bits -= 8;
            }
        }
        return out;
    }
}
