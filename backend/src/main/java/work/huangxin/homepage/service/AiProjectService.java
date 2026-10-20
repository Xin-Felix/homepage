package work.huangxin.homepage.service;

import java.util.List;
import java.util.Locale;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import work.huangxin.homepage.common.exception.ConflictException;
import work.huangxin.homepage.common.exception.NotFoundException;
import work.huangxin.homepage.domain.AiProject;
import work.huangxin.homepage.repository.AiProjectRepository;

@Service
public class AiProjectService extends SortableCrudService<AiProject> {

    private final AiProjectRepository aiProjectRepository;

    public AiProjectService(AiProjectRepository repository) {
        super(repository, "AI 项目不存在");
        this.aiProjectRepository = repository;
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = SiteService.CACHE, allEntries = true)
    public AiProject create(AiProject input) {
        normalizeAndCheckSlug(input, null);
        return super.create(input);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = SiteService.CACHE, allEntries = true)
    public AiProject update(Long id, AiProject input) {
        normalizeAndCheckSlug(input, id);
        return super.update(id, input);
    }

    @Transactional(readOnly = true)
    public List<AiProject> listPublished() {
        return aiProjectRepository.findAllByVisibleTrueOrderBySortOrderAscIdAsc();
    }

    @Transactional(readOnly = true)
    public AiProject getPublished(String slug) {
        return aiProjectRepository.findBySlugAndVisibleTrue(slug)
                .orElseThrow(() -> new NotFoundException("AI 项目不存在或尚未发布"));
    }

    private void normalizeAndCheckSlug(AiProject project, Long currentId) {
        if (!StringUtils.hasText(project.getSlug())) {
            project.setSlug(null);
            return;
        }
        String slug = project.getSlug().trim().toLowerCase(Locale.ROOT);
        project.setSlug(slug);
        if (aiProjectRepository.existsBySlugAndIdNot(slug, currentId == null ? -1L : currentId)) {
            throw new ConflictException("AI 项目路径已存在，请换一个 slug");
        }
    }
}
