package work.huangxin.homepage.common;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 客户端 IP 工具。
 * <p>
 * 直接使用 request.getRemoteAddr()：部署在 Nginx 等反向代理后面时，
 * 生产配置开启了 server.forward-headers-strategy=native，由 Tomcat 只信任内网代理传来的 X-Forwarded-For，
 * 避免任意客户端伪造请求头绕过限流。
 */
public final class ClientIp {

    private ClientIp() {
    }

    public static String of(HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        return ip == null ? "unknown" : ip;
    }

    /** 留言里只保存 IP 的摘要，便于识别刷屏又不直接落库明文 IP。 */
    public static String hash(String ip) {
        return sha256Hex(ip).substring(0, 16);
    }

    public static String sha256Hex(String value) {
        return HexFormat.of().formatHex(sha256(value));
    }

    public static byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 不可用", e);
        }
    }
}
