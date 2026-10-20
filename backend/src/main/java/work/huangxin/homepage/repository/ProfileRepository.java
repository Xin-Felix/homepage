package work.huangxin.homepage.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import work.huangxin.homepage.domain.Profile;

public interface ProfileRepository extends JpaRepository<Profile, Long> {

    /**
     * 访问日志和累计数在同一事务中更新。锁住单例行可保证多实例并发首访也只计一次。
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Profile p where p.id = :id")
    Optional<Profile> findByIdForUpdate(@Param("id") Long id);

    /** 只读访问量，不把可能陈旧的 Profile 实体带入主页内容缓存。 */
    @Query("select p.views from Profile p where p.id = :id")
    Optional<Long> findViewsById(@Param("id") Long id);
}
