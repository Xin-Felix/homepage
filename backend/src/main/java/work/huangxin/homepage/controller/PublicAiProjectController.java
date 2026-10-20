package work.huangxin.homepage.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.ApiResponse;
import work.huangxin.homepage.domain.AiProject;
import work.huangxin.homepage.ratelimit.RateLimit;
import work.huangxin.homepage.service.AiProjectService;

@RestController
@RequestMapping("/api/public/ai-projects")
@RequiredArgsConstructor
public class PublicAiProjectController {

    private final AiProjectService aiProjectService;

    @GetMapping
    @RateLimit(RateLimit.CHEAP)
    public ApiResponse<List<AiProjectView>> list(HttpServletRequest request) {
        return ApiResponse.ok(aiProjectService.listPublished().stream().map(AiProjectView::from).toList());
    }

    @GetMapping("/{slug}")
    @RateLimit(RateLimit.CHEAP)
    public ApiResponse<AiProjectDetail> detail(@PathVariable("slug") String slug, HttpServletRequest request) {
        return ApiResponse.ok(AiProjectDetail.from(aiProjectService.getPublished(slug)));
    }

    public record AiProjectView(Long id, String slug, String title, String summary, String status,
                                String models, List<String> stack) {
        static AiProjectView from(AiProject p) {
            return new AiProjectView(p.getId(), p.getSlug(), p.getTitle(), p.getSummary(),
                    p.getStatus().name(), p.getModels(), List.copyOf(p.getStack()));
        }
    }

    public record AiProjectDetail(Long id, String slug, String title, String summary, String status,
                                  String models, List<String> stack, String demoUrl, String repoUrl,
                                  String contentMarkdown) {
        static AiProjectDetail from(AiProject p) {
            return new AiProjectDetail(p.getId(), p.getSlug(), p.getTitle(), p.getSummary(),
                    p.getStatus().name(), p.getModels(), List.copyOf(p.getStack()),
                    p.getDemoUrl(), p.getRepoUrl(), p.getContentMarkdown());
        }
    }
}
