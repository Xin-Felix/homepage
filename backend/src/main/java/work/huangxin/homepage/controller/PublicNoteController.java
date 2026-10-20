package work.huangxin.homepage.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.ApiResponse;
import work.huangxin.homepage.domain.Note;
import work.huangxin.homepage.ratelimit.RateLimit;
import work.huangxin.homepage.service.NoteService;

@RestController
@RequestMapping("/api/public/notes")
@RequiredArgsConstructor
public class PublicNoteController {

    private final NoteService noteService;

    @GetMapping
    @RateLimit(RateLimit.CHEAP)
    public ApiResponse<List<NoteSummary>> list(HttpServletRequest request) {
        return ApiResponse.ok(noteService.listPublished().stream().map(NoteSummary::from).toList());
    }

    @GetMapping("/{slug}")
    @RateLimit(RateLimit.CHEAP)
    public ApiResponse<NoteDetail> detail(@PathVariable("slug") String slug, HttpServletRequest request) {
        return ApiResponse.ok(NoteDetail.from(noteService.getPublished(slug)));
    }

    public record NoteSummary(Long id, String slug, String title, String summary, List<String> tags,
                              long readCount, LocalDateTime publishedAt) {
        static NoteSummary from(Note note) {
            return new NoteSummary(note.getId(), note.getSlug(), note.getTitle(), note.getSummary(),
                    List.copyOf(note.getTags()), note.getReadCount(), note.getPublishedAt());
        }
    }

    public record NoteDetail(Long id, String slug, String title, String summary, List<String> tags,
                             String contentMarkdown, long readCount, LocalDateTime publishedAt,
                             LocalDateTime updatedAt) {
        static NoteDetail from(Note note) {
            return new NoteDetail(note.getId(), note.getSlug(), note.getTitle(), note.getSummary(),
                    List.copyOf(note.getTags()), note.getContentMarkdown(), note.getReadCount(),
                    note.getPublishedAt(), note.getUpdatedAt());
        }
    }
}
