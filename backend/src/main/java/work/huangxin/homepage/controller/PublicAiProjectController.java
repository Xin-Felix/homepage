package work.huangxin.homepage.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.ApiResponse;
import work.huangxin.homepage.common.SiteLang;
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
        SiteLang lang = SiteLang.from(request);
        return ApiResponse.ok(aiProjectService.listPublished().stream()
                .map(p -> AiProjectView.from(p, lang)).toList());
    }

    @GetMapping("/{slug}")
    @RateLimit(RateLimit.CHEAP)
    public ApiResponse<AiProjectDetail> detail(@PathVariable("slug") String slug, HttpServletRequest request) {
        return ApiResponse.ok(AiProjectDetail.from(aiProjectService.getPublished(slug), SiteLang.from(request)));
    }

    public record AiProjectView(Long id, String slug, String title, String summary, String status,
                                String models, List<String> stack) {
        static AiProjectView from(AiProject p, SiteLang lang) {
            return new AiProjectView(p.getId(), p.getSlug(),
                    lang.pick(p.getTitle(), p.getTitleEn()),
                    lang.pick(p.getSummary(), p.getSummaryEn()),
                    p.getStatus().name(),
                    lang.pick(p.getModels(), p.getModelsEn()),
                    lang.pickList(p.getStack(), p.getStackEn()));
        }
    }

    public record AiProjectDetail(Long id, String slug, String title, String summary, String status,
                                  String models, List<String> stack, String demoUrl, String repoUrl,
                                  String contentMarkdown) {
        static AiProjectDetail from(AiProject p, SiteLang lang) {
            return new AiProjectDetail(p.getId(), p.getSlug(),
                    lang.pick(p.getTitle(), p.getTitleEn()),
                    lang.pick(p.getSummary(), p.getSummaryEn()),
                    p.getStatus().name(),
                    lang.pick(p.getModels(), p.getModelsEn()),
                    lang.pickList(p.getStack(), p.getStackEn()),
                    p.getDemoUrl(), p.getRepoUrl(),
                    lang.pick(p.getContentMarkdown(), p.getContentMarkdownEn()));
        }
    }
}
