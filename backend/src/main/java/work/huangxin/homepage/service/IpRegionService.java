package work.huangxin.homepage.service;

import java.io.InputStream;
import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.util.ArrayList;
import java.util.List;

import org.lionsoul.ip2region.service.Config;
import org.lionsoul.ip2region.service.Ip2Region;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;

/**
 * 使用随镜像发布的 ip2region XDB 快照离线解析 IP 地区。
 * 查询失败只让地区留空，绝不影响主页访问或访问统计。
 */
@Slf4j
@Service
public class IpRegionService {

    private static final String IPV4_DATABASE = "geo/ip2region_v4.xdb";
    private static final String IPV6_DATABASE = "geo/ip2region_v6.xdb";
    private static final String LOCAL_REGION = "本地 / 内网";
    private static final int MAX_REGION_LENGTH = 128;

    private volatile Ip2Region searcher;

    @PostConstruct
    void initialize() {
        try (InputStream ipv4 = new ClassPathResource(IPV4_DATABASE).getInputStream();
             InputStream ipv6 = new ClassPathResource(IPV6_DATABASE).getInputStream()) {
            Config v4Config = Config.custom()
                    .setCachePolicy(Config.BufferCache)
                    .setXdbInputStream(ipv4)
                    .asV4();
            Config v6Config = Config.custom()
                    .setCachePolicy(Config.BufferCache)
                    .setXdbInputStream(ipv6)
                    .asV6();
            searcher = Ip2Region.create(v4Config, v6Config);
            log.info("已加载离线 IP 地区库（IPv4/IPv6）");
        } catch (Exception exception) {
            // 地区只是后台辅助信息，资源异常不能阻断站点主服务。
            searcher = null;
            log.error("离线 IP 地区库加载失败，后续访问日志地区将留空", exception);
        }
    }

    /** 规范为数值 IP 字面量，拒绝 host 名称，避免触发 DNS 查询。 */
    public String normalize(String rawIp) {
        if (!StringUtils.hasText(rawIp) || "unknown".equalsIgnoreCase(rawIp.trim())) return null;

        String value = rawIp.trim();
        if (value.startsWith("[")) {
            int closing = value.indexOf(']');
            if (closing < 0) return null;
            value = value.substring(1, closing);
        }
        int zone = value.indexOf('%');
        if (zone >= 0) value = value.substring(0, zone);
        if (!value.matches("[0-9A-Fa-f:.]+")) return null;

        try {
            return InetAddress.getByName(value).getHostAddress();
        } catch (Exception ignored) {
            return null;
        }
    }

    /** 返回持久化地区快照；公网未收录或地区库不可用时返回 null。 */
    public String lookup(String rawIp) {
        String ip = normalize(rawIp);
        if (ip == null) return null;

        InetAddress address;
        try {
            address = InetAddress.getByName(ip);
        } catch (Exception ignored) {
            return null;
        }
        if (isPrivateOrLocal(address)) return LOCAL_REGION;

        Ip2Region current = searcher;
        if (current == null) return null;
        try {
            return format(current.search(ip));
        } catch (Exception ignored) {
            // 不记录带有原始 IP 的错误日志，防止完整 IP 扩散到日志系统。
            return null;
        }
    }

    @PreDestroy
    void close() {
        Ip2Region current = searcher;
        searcher = null;
        if (current == null) return;
        try {
            current.close();
        } catch (Exception exception) {
            log.warn("关闭离线 IP 地区库失败", exception);
        }
    }

    private static boolean isPrivateOrLocal(InetAddress address) {
        if (address.isAnyLocalAddress()
                || address.isLoopbackAddress()
                || address.isLinkLocalAddress()
                || address.isSiteLocalAddress()
                || address.isMulticastAddress()) {
            return true;
        }

        byte[] bytes = address.getAddress();
        if (address instanceof Inet4Address && bytes.length == 4) {
            int first = bytes[0] & 0xff;
            int second = bytes[1] & 0xff;
            // 100.64.0.0/10：运营商级 NAT，不适合做公开地区归属。
            return first == 100 && second >= 64 && second <= 127;
        }
        if (address instanceof Inet6Address && bytes.length == 16) {
            // fc00::/7：IPv6 unique-local。
            return (bytes[0] & 0xfe) == 0xfc;
        }
        return false;
    }

    private static String format(String rawRegion) {
        if (!StringUtils.hasText(rawRegion)) return null;

        String[] values = rawRegion.split("\\|", -1);
        List<String> parts = new ArrayList<>(3);
        // XDB 约定：国家 | 省/州 | 城市 | ISP | 国家码；地区展示不保存 ISP。
        for (int index = 0; index < Math.min(3, values.length); index++) {
            String value = values[index].trim();
            if (!value.isEmpty() && !"0".equals(value) && !parts.contains(value)) parts.add(value);
        }
        if (parts.isEmpty()) return null;

        String region = String.join(" · ", parts);
        return region.length() <= MAX_REGION_LENGTH ? region : region.substring(0, MAX_REGION_LENGTH);
    }
}
