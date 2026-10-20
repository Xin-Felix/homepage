package work.huangxin.homepage.controller.admin;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.ApiResponse;
import work.huangxin.homepage.common.PageResult;
import work.huangxin.homepage.service.VisitService;
import work.huangxin.homepage.service.VisitService.VisitLogItem;

@RestController
@RequestMapping("/api/admin/visits")
@RequiredArgsConstructor
public class VisitLogAdminController {

    private final VisitService visitService;

    @GetMapping
    public ApiResponse<PageResult<VisitLogItem>> list(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        return ApiResponse.ok(visitService.list(safePage, safeSize));
    }
}
