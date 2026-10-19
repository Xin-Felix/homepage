package work.huangxin.homepage.controller.admin;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.ApiResponse;
import work.huangxin.homepage.service.ExperienceService;
import work.huangxin.homepage.service.MessageService;
import work.huangxin.homepage.service.ProjectService;
import work.huangxin.homepage.service.SiteService;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class DashboardAdminController {

    private final SiteService siteService;
    private final ExperienceService experienceService;
    private final ProjectService projectService;
    private final MessageService messageService;

    @GetMapping
    public ApiResponse<Dashboard> get() {
        return ApiResponse.ok(new Dashboard(
                siteService.getProfile().getViews(),
                messageService.count(),
                messageService.countUnread(),
                experienceService.count(),
                projectService.count()));
    }

    public record Dashboard(long views, long messages, long unreadMessages, long experiences, long projects) {
    }
}
