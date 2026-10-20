package work.huangxin.homepage.service;

import java.util.List;

import org.springframework.beans.BeanUtils;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import work.huangxin.homepage.common.ClientIp;
import work.huangxin.homepage.config.HomepageProperties;
import work.huangxin.homepage.domain.ContactLink;
import work.huangxin.homepage.domain.Experience;
import work.huangxin.homepage.domain.Profile;
import work.huangxin.homepage.domain.Project;
import work.huangxin.homepage.repository.ContactLinkRepository;
import work.huangxin.homepage.repository.ExperienceRepository;
import work.huangxin.homepage.repository.ProfileRepository;
import work.huangxin.homepage.repository.ProjectRepository;

/**
 * 主页数据：内容读取走缓存，访问量单独从数据库读取。
 */
@Service
public class SiteService {

    public static final String CACHE = "site";

    private final ProfileRepository profileRepository;
    private final ExperienceRepository experienceRepository;
    private final ProjectRepository projectRepository;
    private final ContactLinkRepository contactLinkRepository;

    /**
     * IP 只以 SHA-256 摘要作为缓存键，不保存明文。
     * 当前部署是单应用实例；容器重启后去重窗口会重新开始。
     */
    private final Cache<String, Boolean> recentVisitors;

    public SiteService(ProfileRepository profileRepository,
                       ExperienceRepository experienceRepository,
                       ProjectRepository projectRepository,
                       ContactLinkRepository contactLinkRepository,
                       HomepageProperties properties) {
        this.profileRepository = profileRepository;
        this.experienceRepository = experienceRepository;
        this.projectRepository = projectRepository;
        this.contactLinkRepository = contactLinkRepository;
        this.recentVisitors = Caffeine.newBuilder()
                .expireAfterWrite(properties.views().uniqueWindow())
                .maximumSize(properties.views().maxTrackedIps())
                .build();
    }

    @Cacheable(cacheNames = CACHE, key = "'home'")
    @Transactional(readOnly = true)
    public SiteData getSiteData() {
        return new SiteData(
                getProfile(),
                experienceRepository.findAllByVisibleTrueOrderBySortOrderAscIdAsc(),
                projectRepository.findAllByVisibleTrueOrderBySortOrderAscIdAsc(),
                contactLinkRepository.findAllByVisibleTrueOrderBySortOrderAscIdAsc());
    }

    @Transactional(readOnly = true)
    public Profile getProfile() {
        return profileRepository.findById(Profile.SINGLETON_ID).orElseGet(Profile::new);
    }

    @Transactional
    @CacheEvict(cacheNames = CACHE, allEntries = true)
    public Profile updateProfile(Profile input) {
        Profile profile = getProfile();
        BeanUtils.copyProperties(input, profile, "id", "views", "updatedAt");
        return profileRepository.save(profile);
    }

    /**
     * 同一 IP 在配置窗口内只计一次，并返回数据库中的最新累计值。
     * 数据库更新失败时会撤销本次内存标记，允许下次请求重试。
     */
    @Transactional
    public long recordView(String ip) {
        String visitorKey = ClientIp.sha256Hex(ip == null ? "unknown" : ip);
        boolean firstVisitInWindow = recentVisitors.asMap().putIfAbsent(visitorKey, Boolean.TRUE) == null;
        if (firstVisitInWindow) {
            try {
                int updatedRows = profileRepository.incrementViews(Profile.SINGLETON_ID);
                if (updatedRows != 1) {
                    throw new IllegalStateException("主页资料不存在，无法记录访问量");
                }
            } catch (RuntimeException e) {
                recentVisitors.invalidate(visitorKey);
                throw e;
            }
        }
        return getViewCount();
    }

    @Transactional(readOnly = true)
    public long getViewCount() {
        return profileRepository.findViewsById(Profile.SINGLETON_ID).orElse(0L);
    }

    public record SiteData(Profile profile,
                           List<Experience> experiences,
                           List<Project> projects,
                           List<ContactLink> contacts) {
    }
}
