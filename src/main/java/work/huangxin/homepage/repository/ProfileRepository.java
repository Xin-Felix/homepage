package work.huangxin.homepage.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import work.huangxin.homepage.domain.Profile;

public interface ProfileRepository extends JpaRepository<Profile, Long> {

    /** 原子自增访问量，避免并发请求发生 lost update。 */
    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Profile p set p.views = p.views + 1 where p.id = :id")
    int incrementViews(@Param("id") Long id);

    /** 只读访问量，不把可能陈旧的 Profile 实体带入主页内容缓存。 */
    @Query("select p.views from Profile p where p.id = :id")
    Optional<Long> findViewsById(@Param("id") Long id);
}
