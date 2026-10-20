package work.huangxin.homepage.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import work.huangxin.homepage.domain.VisitLog;

public interface VisitLogRepository extends JpaRepository<VisitLog, Long> {

    /** 快速判断已有窗口；同一日志的刷新通过原子 UPDATE 累计。 */
    Optional<VisitLog> findFirstByIpHashOrderByIdDesc(String ipHash);

    /** 创建新窗口前在全局计数锁内重新读取，处理多实例并发首访。 */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<VisitLog> findTopByIpHashOrderByIdDesc(String ipHash);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update VisitLog v
               set v.hits = v.hits + 1,
                   v.lastVisitedAt = :visitedAt,
                   v.userAgent = coalesce(:userAgent, v.userAgent),
                   v.referer = coalesce(:referer, v.referer)
             where v.id = :id
            """)
    int touch(@Param("id") Long id,
              @Param("visitedAt") LocalDateTime visitedAt,
              @Param("userAgent") String userAgent,
              @Param("referer") String referer);

    Page<VisitLog> findAllByOrderByIdDesc(Pageable pageable);

    long deleteByLastVisitedAtBefore(LocalDateTime threshold);
}
