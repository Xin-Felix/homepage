package work.huangxin.homepage.service;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;
import work.huangxin.homepage.common.ClientIp;
import work.huangxin.homepage.common.PageResult;
import work.huangxin.homepage.config.HomepageProperties;
import work.huangxin.homepage.domain.Profile;
import work.huangxin.homepage.domain.VisitLog;
import work.huangxin.homepage.repository.ProfileRepository;
import work.huangxin.homepage.repository.VisitLogRepository;

/** 主页独立访问计数和访问日志。 */
@Slf4j
@Service
public class VisitService {

    private static final int MAX_PATH = 100;
    private static final String DEVELOPMENT_SALT = "homepage-development-only-salt";

    private final VisitLogRepository visitLogRepository;
    private final ProfileRepository profileRepository;
    private final Duration uniqueWindow;
    private final Duration logRetention;
    private final String hashSalt;

    public VisitService(VisitLogRepository visitLogRepository,
                        ProfileRepository profileRepository,
                        HomepageProperties properties,
                        Environment environment) {
        this.visitLogRepository = visitLogRepository;
        this.profileRepository = profileRepository;
        this.uniqueWindow = properties.views().uniqueWindow();
        this.logRetention = properties.views().logRetention();
        if (uniqueWindow.isZero() || uniqueWindow.isNegative()) {
            throw new IllegalStateException("VISITOR_UNIQUE_WINDOW 必须大于 0");
        }
        if (logRetention.isZero() || logRetention.isNegative()) {
            throw new IllegalStateException("VISITOR_LOG_RETENTION 必须大于 0");
        }
        if (logRetention.compareTo(uniqueWindow) < 0) {
            throw new IllegalStateException("VISITOR_LOG_RETENTION 不能短于 VISITOR_UNIQUE_WINDOW");
        }

        String configuredSalt = properties.views().hashSalt();
        if (!StringUtils.hasText(configuredSalt)
                && environment.acceptsProfiles(Profiles.of("prod"))) {
            throw new IllegalStateException("生产环境必须通过 VISITOR_HASH_SALT 配置独立的访问指纹盐值");
        }
        this.hashSalt = StringUtils.hasText(configuredSalt) ? configuredSalt : DEVELOPMENT_SALT;
    }

    /**
     * 记录主页请求。窗口内刷新只原子更新对应日志；仅新独立访问短暂锁定累计数行，
     * 避免所有刷新请求争用同一个数据库锁，同时保证多实例下日志与累计数一致。
     */
    @Transactional
    public long record(VisitRequest request) {
        LocalDateTime now = LocalDateTime.now();
        String ip = StringUtils.hasText(request.ip()) ? request.ip() : "unknown";
        String ipHash = ClientIp.sha256Hex(hashSalt + '\0' + ip);
        String userAgent = classifyUserAgent(request.userAgent());
        String referer = normalizeReferer(request.referer());

        VisitLog latest = visitLogRepository.findFirstByIpHashOrderByIdDesc(ipHash).orElse(null);
        if (isWithinWindow(latest, now)) {
            touch(latest.getId(), now, userAgent, referer);
            return currentViews();
        }

        // 新窗口需要增加全局累计数。锁住 Profile 后重新检查，防止另一实例已创建同一 IP 的窗口。
        Profile profile = profileRepository.findByIdForUpdate(Profile.SINGLETON_ID)
                .orElseThrow(() -> new IllegalStateException("主页资料不存在，无法记录访问量"));
        latest = visitLogRepository.findTopByIpHashOrderByIdDesc(ipHash).orElse(null);
        if (isWithinWindow(latest, now)) {
            touch(latest.getId(), now, userAgent, referer);
            return profile.getViews();
        }

        VisitLog logEntry = new VisitLog();
        logEntry.setIpHash(ipHash);
        logEntry.setIpMasked(ClientIp.mask(ip));
        logEntry.setPath(limit(request.path(), MAX_PATH));
        logEntry.setUserAgent(userAgent);
        logEntry.setReferer(referer);
        logEntry.setHits(1L);
        logEntry.setFirstVisitedAt(now);
        logEntry.setLastVisitedAt(now);
        visitLogRepository.save(logEntry);
        profile.setViews(profile.getViews() + 1);
        return profile.getViews();
    }

    @Transactional(readOnly = true)
    public PageResult<VisitLogItem> list(int page, int size) {
        Page<VisitLog> result = visitLogRepository.findAllByOrderByIdDesc(PageRequest.of(page, size));
        return new PageResult<>(
                result.getContent().stream().map(VisitLogItem::from).toList(),
                result.getTotalElements(), page, size, result.getTotalPages());
    }

    /** 只保留近期审计数据，累计独立访问数不受日志清理影响。 */
    @Scheduled(fixedDelay = 1, timeUnit = TimeUnit.DAYS)
    @Transactional
    public void deleteExpiredLogs() {
        long deleted = visitLogRepository.deleteByLastVisitedAtBefore(LocalDateTime.now().minus(logRetention));
        if (deleted > 0) {
            log.info("已清理 {} 条过期访问日志", deleted);
        }
    }

    private boolean isWithinWindow(VisitLog logEntry, LocalDateTime now) {
        return logEntry != null && logEntry.getFirstVisitedAt().plus(uniqueWindow).isAfter(now);
    }

    private void touch(Long id, LocalDateTime now, String userAgent, String referer) {
        if (visitLogRepository.touch(id, now, userAgent, referer) != 1) {
            throw new IllegalStateException("访问日志更新失败");
        }
    }

    private long currentViews() {
        return profileRepository.findViewsById(Profile.SINGLETON_ID).orElse(0L);
    }

    /** 只保存来源站点，不保存可能携带 token 或个人参数的路径、查询串和 fragment。 */
    private static String normalizeReferer(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            URI uri = new URI(value.trim());
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            if (!("http".equals(scheme) || "https".equals(scheme)) || uri.getHost() == null) {
                return null;
            }
            return new URI(scheme, null, uri.getHost(), uri.getPort(), null, null, null).toASCIIString();
        } catch (URISyntaxException | IllegalArgumentException ignored) {
            return null;
        }
    }

    /** 把原始 User-Agent 降维成浏览器、系统和设备类型，避免长期保存设备指纹细节。 */
    private static String classifyUserAgent(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String ua = value.toLowerCase(Locale.ROOT);
        if (ua.contains("bot") || ua.contains("crawler") || ua.contains("spider") || ua.contains("slurp")) {
            return "Bot";
        }
        String browser;
        if (ua.contains("edg/")) browser = "Edge";
        else if (ua.contains("firefox/")) browser = "Firefox";
        else if (ua.contains("chrome/") || ua.contains("crios/")) browser = "Chrome";
        else if (ua.contains("safari/")) browser = "Safari";
        else if (ua.contains("curl/")) browser = "curl";
        else browser = "其他浏览器";

        String system;
        if (ua.contains("android")) system = "Android";
        else if (ua.contains("iphone") || ua.contains("ipad") || ua.contains("ios")) system = "iOS";
        else if (ua.contains("windows")) system = "Windows";
        else if (ua.contains("mac os") || ua.contains("macintosh")) system = "macOS";
        else if (ua.contains("linux")) system = "Linux";
        else system = "其他系统";

        String device = ua.contains("mobile") || ua.contains("iphone") || ua.contains("android")
                ? "移动端" : "桌面端";
        return browser + " · " + system + " · " + device;
    }

    private static String limit(String value, int maxLength) {
        String normalized = value == null ? "/" : value.replaceAll("[\\r\\n]+", " ").trim();
        if (normalized.isEmpty()) {
            normalized = "/";
        }
        return normalized.length() <= maxLength ? normalized : normalized.substring(0, maxLength);
    }

    public record VisitRequest(String ip, String path, String userAgent, String referer) {
    }

    /** 白名单 DTO：后台不会拿到完整 IP 指纹。 */
    public record VisitLogItem(
            Long id,
            String source,
            String fingerprint,
            String path,
            String userAgent,
            String referer,
            long hits,
            LocalDateTime firstVisitedAt,
            LocalDateTime lastVisitedAt) {

        static VisitLogItem from(VisitLog log) {
            String fingerprint = log.getIpHash().substring(0, Math.min(10, log.getIpHash().length()));
            return new VisitLogItem(log.getId(), log.getIpMasked(), fingerprint, log.getPath(),
                    log.getUserAgent(), log.getReferer(), log.getHits(),
                    log.getFirstVisitedAt(), log.getLastVisitedAt());
        }
    }
}
