package work.huangxin.homepage.repository;

import java.util.Optional;

import work.huangxin.homepage.domain.AiProject;

public interface AiProjectRepository extends SortableRepository<AiProject> {
    Optional<AiProject> findBySlugAndVisibleTrue(String slug);
    boolean existsBySlugAndIdNot(String slug, Long id);
}
