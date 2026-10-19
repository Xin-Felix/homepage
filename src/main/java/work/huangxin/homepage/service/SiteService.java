package work.huangxin.homepage.service;

import java.time.Duration;
import java.util.List;

import org.springframework.beans.BeanUtils;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import work.huangxin.homepage.domain.ContactLink;
import work.huangxin.homepage.domain.Experience;
import work.huangxin.homepage.domain.Profile;
import work.huangxin.homepage.domain.Project;
import work.huangxin.homepage.repository.ContactLinkRepository;
import work.huangxin.homepage.repository.ExperienceRepository;
import work.huangxin.homepage.repository.ProfileRepository;
import work.huangxin.homepage.repository.ProjectRepository;

/**
 * 主页数据：读取走缓存，后台任意写操作后清缓存。
 */
@Service
public class SiteService {

    public static final String CACHE = "site";

    private final ProfileRepository profileRepository;
    private final ExperienceRepository experienceRepository;
    private final ProjectRepository projectRepository;
    private final ContactLinkRepository contactLinkRepository;

    /** 同一 IP 30 分钟内只计一次访问 */
    private final Cache<String, Boolean> recentVisitors = Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofMinutes(30))
            .maximumSize(50_000)
            .build();

    public SiteService(ProfileRepository profileRepository,
                       ExperienceRepository experienceRepository,
                       ProjectRepository projectRepository,
                       ContactLinkRepository contactLinkRepository) {
        this.profileRepository = profileRepository;
        this.experienceRepository = experienceRepository;
        this.projectRepository = projectRepository;
        this.contactLinkRepository = contactLinkRepository;
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

    public void recordView(String ip) {
        if (recentVisitors.asMap().putIfAbsent(ip, Boolean.TRUE) == null) {
            profileRepository.incrementViews(Profile.SINGLETON_ID);
        }
    }

    public record SiteData(Profile profile,
                           List<Experience> experiences,
                           List<Project> projects,
                           List<ContactLink> contacts) {
    }
}
