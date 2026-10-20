package work.huangxin.homepage.service;

import java.util.Locale;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import work.huangxin.homepage.common.exception.ConflictException;
import work.huangxin.homepage.common.exception.NotFoundException;
import work.huangxin.homepage.domain.Project;
import work.huangxin.homepage.repository.ProjectRepository;

@Service
public class ProjectService extends SortableCrudService<Project> {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository repository) {
        super(repository, "项目不存在");
        this.projectRepository = repository;
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = SiteService.CACHE, allEntries = true)
    public Project create(Project input) {
        normalizeAndCheckSlug(input, null);
        return super.create(input);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = SiteService.CACHE, allEntries = true)
    public Project update(Long id, Project input) {
        normalizeAndCheckSlug(input, id);
        return super.update(id, input);
    }

    @Transactional(readOnly = true)
    public Project getPublishedBySlug(String slug) {
        return projectRepository.findBySlugAndVisibleTrueAndDetailPublishedTrue(slug)
                .orElseThrow(() -> new NotFoundException("项目案例不存在或尚未发布"));
    }

    private void normalizeAndCheckSlug(Project project, Long currentId) {
        if (!StringUtils.hasText(project.getSlug())) {
            project.setSlug(null);
            return;
        }
        String slug = project.getSlug().trim().toLowerCase(Locale.ROOT);
        project.setSlug(slug);
        long ignoredId = currentId == null ? -1L : currentId;
        if (projectRepository.existsBySlugAndIdNot(slug, ignoredId)) {
            throw new ConflictException("项目路径已存在，请换一个 slug");
        }
    }
}
