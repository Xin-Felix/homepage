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

/** 主页内容读取走缓存；访问量由 VisitService 单独维护和读取。 */
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
