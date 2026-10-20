package work.huangxin.homepage.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.NoRepositoryBean;

import work.huangxin.homepage.domain.SortableEntity;

@NoRepositoryBean
public interface SortableRepository<T extends SortableEntity> extends JpaRepository<T, Long> {

    List<T> findAllByOrderBySortOrderAscIdAsc();

    List<T> findAllByVisibleTrueOrderBySortOrderAscIdAsc();

    @Query("select coalesce(max(e.sortOrder), 0) from #{#entityName} e")
    Integer maxSortOrder();
}
