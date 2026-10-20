package work.huangxin.homepage.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.ApiResponse;
import work.huangxin.homepage.domain.Project;
import work.huangxin.homepage.ratelimit.RateLimit;
import work.huangxin.homepage.service.ProjectService;

/** 已发布项目案例的公开白名单接口。 */
@RestController
@RequestMapping("/api/public/projects")
@RequiredArgsConstructor
public class PublicProjectController {

    private final ProjectService projectService;

    @GetMapping("/{slug}")
    @RateLimit(RateLimit.CHEAP)
    public ApiResponse<ProjectDetail> detail(@PathVariable("slug") String slug, HttpServletRequest request) {
        return ApiResponse.ok(ProjectDetail.from(projectService.getPublishedBySlug(slug)));
    }

    public record ProjectDetail(
            Long id, String slug, String name, String description, String role,
            String period, String link, List<String> meta, String contentMarkdown) {
        static ProjectDetail from(Project p) {
            return new ProjectDetail(p.getId(), p.getSlug(), p.getName(), p.getDescription(), p.getRole(),
                    p.getPeriod(), p.getLink(), List.copyOf(p.getMeta()), p.getContentMarkdown());
        }
    }
}
