package work.huangxin.homepage.controller.admin;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.ApiResponse;
import work.huangxin.homepage.service.AnalyticsService;
import work.huangxin.homepage.service.AnalyticsService.Analytics;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
public class AnalyticsAdminController {

    private final AnalyticsService analyticsService;

    @GetMapping
    public ApiResponse<Analytics> overview(@RequestParam(name = "days", defaultValue = "30") int days) {
        return ApiResponse.ok(analyticsService.overview(days));
    }
}
