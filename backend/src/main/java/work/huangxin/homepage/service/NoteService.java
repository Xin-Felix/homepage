package work.huangxin.homepage.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.exception.ConflictException;
import work.huangxin.homepage.common.exception.NotFoundException;
import work.huangxin.homepage.domain.Note;
import work.huangxin.homepage.repository.NoteRepository;

@Service
@RequiredArgsConstructor
public class NoteService {

    private static final String NOT_FOUND = "技术笔记不存在";
    private final NoteRepository noteRepository;

    @Transactional(readOnly = true)
    public List<Note> listAdmin() {
        return noteRepository.findAllByOrderByIdDesc();
    }

    @Transactional(readOnly = true)
    public List<Note> listPublished() {
        return noteRepository.findAllByPublishedTrueOrderByPublishedAtDescIdDesc();
    }

    @Transactional
    public Note create(Note input) {
        input.setId(null);
        normalizeAndValidate(input, null);
        applyPublishingState(input, false);
        return noteRepository.save(input);
    }

    @Transactional
    public Note update(Long id, Note input) {
        Note note = noteRepository.findById(id).orElseThrow(() -> new NotFoundException(NOT_FOUND));
        normalizeAndValidate(input, id);
        boolean wasPublished = note.isPublished();
        BeanUtils.copyProperties(input, note, "id", "readCount", "publishedAt", "createdAt", "updatedAt");
        applyPublishingState(note, wasPublished);
        return noteRepository.save(note);
    }

    @Transactional
    public void delete(Long id) {
        Note note = noteRepository.findById(id).orElseThrow(() -> new NotFoundException(NOT_FOUND));
        noteRepository.delete(note);
    }

    /** 公开详情每次 SSR 请求增加阅读量，然后返回最新数据。 */
    @Transactional
    public Note getPublished(String slug) {
        Note note = noteRepository.findBySlugAndPublishedTrue(slug)
                .orElseThrow(() -> new NotFoundException("技术笔记不存在或尚未发布"));
        noteRepository.incrementReadCount(note.getId());
        note.setReadCount(note.getReadCount() + 1);
        return note;
    }

    @Transactional(readOnly = true)
    public long count() {
        return noteRepository.count();
    }

    private void normalizeAndValidate(Note note, Long currentId) {
        String slug = note.getSlug().trim().toLowerCase(Locale.ROOT);
        note.setSlug(slug);
        if (noteRepository.existsBySlugAndIdNot(slug, currentId == null ? -1L : currentId)) {
            throw new ConflictException("笔记路径已存在，请换一个 slug");
        }
    }

    private static void applyPublishingState(Note note, boolean wasPublished) {
        if (note.isPublished() && !wasPublished) {
            note.setPublishedAt(LocalDateTime.now());
        } else if (!note.isPublished()) {
            note.setPublishedAt(null);
        }
    }
}
