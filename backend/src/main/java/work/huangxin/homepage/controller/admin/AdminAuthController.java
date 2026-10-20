package work.huangxin.homepage.controller.admin;

import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.auth.AdminAuthService;
import work.huangxin.homepage.auth.AdminAuthService.LoginResult;
import work.huangxin.homepage.common.ApiResponse;
import work.huangxin.homepage.common.ClientIp;
import work.huangxin.homepage.common.exception.UnauthorizedException;
import work.huangxin.homepage.ratelimit.RateLimit;
import work.huangxin.homepage.ratelimit.RateLimitService;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminAuthService adminAuthService;
    private final RateLimitService rateLimitService;

    /** 登录接口不经过鉴权拦截器；同一 IP 连续失败过多会被固定窗口锁定。 */
    @PostMapping("/login")
    @RateLimit(RateLimit.ADMIN)
    public ApiResponse<LoginResult> login(@Valid @RequestBody LoginRequest body, HttpServletRequest request) {
        String ip = ClientIp.of(request);
        var result = rateLimitService.executeLoginAttempt(ip,
                () -> adminAuthService.login(body.username(), body.password()));
        return result.map(ApiResponse::ok)
                .orElseThrow(() -> new UnauthorizedException("账号或密码错误"));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
        adminAuthService.logout(AdminAuthService.extractToken(authorization));
        return ApiResponse.ok();
    }

    /** 前端用来检查本地 token 是否仍然有效。 */
    @GetMapping("/me")
    public ApiResponse<Void> me() {
        return ApiResponse.ok();
    }

    public record LoginRequest(
            @NotBlank(message = "请输入账号")
            @Size(max = 100, message = "账号过长")
            String username,

            @NotBlank(message = "请输入密码")
            @Size(max = 200, message = "密码过长")
            String password) {
    }
}
