package work.huangxin.homepage.common;

import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 客户端 IP 工具。
 * <p>
 * 直接使用 request.getRemoteAddr()：部署在 Nginx 等反向代理后面时，
 * 生产配置由 Tomcat 只信任内网代理传来的 X-Forwarded-For，避免客户端伪造请求头绕过限流。
 */
public final class ClientIp {

    private ClientIp() {
    }

    public static String of(HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        return ip == null ? "unknown" : ip;
    }

    /** 留言使用短摘要，便于识别刷屏又不直接落库明文 IP。 */
    public static String hash(String ip) {
        return sha256Hex(ip).substring(0, 16);
    }

    /** 后台访问日志只展示网段：IPv4 隐藏最后一段，IPv6 归一化后只保留 /48 前缀。 */
    public static String mask(String ip) {
        if (ip == null || ip.isBlank() || "unknown".equals(ip)) {
            return "unknown";
        }
        int zoneIndex = ip.indexOf('%');
        String normalized = zoneIndex >= 0 ? ip.substring(0, zoneIndex) : ip;
        if (!normalized.contains(".") && !normalized.contains(":")) {
            return "unknown";
        }
        try {
            InetAddress address = InetAddress.getByName(normalized);
            byte[] bytes = address.getAddress();
            if (address instanceof Inet4Address && bytes.length == 4) {
                return (bytes[0] & 0xff) + "." + (bytes[1] & 0xff) + "." + (bytes[2] & 0xff) + ".*";
            }
            if (address instanceof Inet6Address && bytes.length == 16) {
                int first = ((bytes[0] & 0xff) << 8) | (bytes[1] & 0xff);
                int second = ((bytes[2] & 0xff) << 8) | (bytes[3] & 0xff);
                int third = ((bytes[4] & 0xff) << 8) | (bytes[5] & 0xff);
                return Integer.toHexString(first) + ":" + Integer.toHexString(second) + ":"
                        + Integer.toHexString(third) + ":*";
            }
        } catch (UnknownHostException ignored) {
            // remoteAddr 理论上总是数值地址；异常时不回显原值。
        }
        return "unknown";
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
