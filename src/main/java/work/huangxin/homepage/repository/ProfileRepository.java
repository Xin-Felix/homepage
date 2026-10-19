package work.huangxin.homepage.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import work.huangxin.homepage.domain.Profile;

public interface ProfileRepository extends JpaRepository<Profile, Long> {

    /** 原子自增访问量，不经过实体，避免和后台编辑互相覆盖 */
    @Transactional
    @Modifying
    @Query("update Profile p set p.views = p.views + 1 where p.id = :id")
    int incrementViews(@Param("id") Long id);
}
