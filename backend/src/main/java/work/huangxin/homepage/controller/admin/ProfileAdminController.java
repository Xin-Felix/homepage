package work.huangxin.homepage.controller.admin;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.ApiResponse;
import work.huangxin.homepage.domain.Profile;
import work.huangxin.homepage.service.SiteService;

@RestController
@RequestMapping("/api/admin/profile")
@RequiredArgsConstructor
public class ProfileAdminController {

    private final SiteService siteService;

    @GetMapping
    public ApiResponse<Profile> get() {
        return ApiResponse.ok(siteService.getProfile());
    }

    @PutMapping
    public ApiResponse<Profile> update(@Valid @RequestBody Profile body) {
        return ApiResponse.ok(siteService.updateProfile(body));
    }
}
