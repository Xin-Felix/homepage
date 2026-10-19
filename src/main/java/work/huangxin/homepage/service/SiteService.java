package work.huangxin.homepage.service;

import java.util.List;

import org.springframework.beans.BeanUtils;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    /**
     * 记录一次主页 PV，并返回数据库中的最新累计值。
     * 访问量不放进主页内容缓存，避免页面长期显示旧数字。
     */
    @Transactional
    public long recordView() {
        int updatedRows = profileRepository.incrementViews(Profile.SINGLETON_ID);
        if (updatedRows != 1) {
            throw new IllegalStateException("主页资料不存在，无法记录访问量");
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
