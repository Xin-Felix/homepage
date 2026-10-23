package work.huangxin.homepage.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.ApiResponse;
import work.huangxin.homepage.common.SiteLang;
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
        SiteLang lang = SiteLang.from(request);
        return ApiResponse.ok(noteService.listPublished().stream()
                .map(note -> NoteSummary.from(note, lang)).toList());
    }

    @GetMapping("/{slug}")
    @RateLimit(RateLimit.CHEAP)
    public ApiResponse<NoteDetail> detail(@PathVariable("slug") String slug,
                                          @RequestParam(name = "count", defaultValue = "true") boolean count,
                                          HttpServletRequest request) {
        return ApiResponse.ok(NoteDetail.from(noteService.getPublished(slug, count), SiteLang.from(request)));
    }

    public record NoteSummary(Long id, String slug, String title, String summary, List<String> tags,
                              long readCount, LocalDateTime publishedAt) {
        static NoteSummary from(Note note, SiteLang lang) {
            return new NoteSummary(note.getId(), note.getSlug(),
                    lang.pick(note.getTitle(), note.getTitleEn()),
                    lang.pick(note.getSummary(), note.getSummaryEn()),
                    lang.pickList(note.getTags(), note.getTagsEn()),
                    note.getReadCount(), note.getPublishedAt());
        }
    }

    public record NoteDetail(Long id, String slug, String title, String summary, List<String> tags,
                             String contentMarkdown, long readCount, LocalDateTime publishedAt,
                             LocalDateTime updatedAt) {
        static NoteDetail from(Note note, SiteLang lang) {
            return new NoteDetail(note.getId(), note.getSlug(),
                    lang.pick(note.getTitle(), note.getTitleEn()),
                    lang.pick(note.getSummary(), note.getSummaryEn()),
                    lang.pickList(note.getTags(), note.getTagsEn()),
                    lang.pick(note.getContentMarkdown(), note.getContentMarkdownEn()),
                    note.getReadCount(), note.getPublishedAt(), note.getUpdatedAt());
        }
    }
}
