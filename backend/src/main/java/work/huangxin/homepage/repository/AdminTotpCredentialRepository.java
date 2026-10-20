package work.huangxin.homepage.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import work.huangxin.homepage.domain.AdminTotpCredential;

public interface AdminTotpCredentialRepository extends JpaRepository<AdminTotpCredential, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from AdminTotpCredential c where c.id = :id")
    Optional<AdminTotpCredential> findByIdForUpdate(@Param("id") Long id);
}
