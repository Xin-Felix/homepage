package work.huangxin.homepage.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import work.huangxin.homepage.domain.Note;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findAllByOrderByIdDesc();

    List<Note> findAllByPublishedTrueOrderByPublishedAtDescIdDesc();

    Optional<Note> findBySlugAndPublishedTrue(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Note n set n.readCount = n.readCount + 1 where n.id = :id")
    int incrementReadCount(@Param("id") Long id);
}
