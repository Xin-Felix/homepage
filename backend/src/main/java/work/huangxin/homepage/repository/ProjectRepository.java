package work.huangxin.homepage.repository;

import java.util.Optional;

import work.huangxin.homepage.domain.Project;

public interface ProjectRepository extends SortableRepository<Project> {

    Optional<Project> findBySlugAndVisibleTrueAndDetailPublishedTrue(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
