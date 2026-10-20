package work.huangxin.homepage.controller.admin;

import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
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

    /**
     * 所有可解析登录请求都进入同一个 IP 原子失败计数区；空值、超长值和错误 TOTP
     * 与普通错误凭据具有相同的 401 行为，不能绕过爆破锁定。
     */
    @PostMapping("/login")
    @RateLimit(RateLimit.ADMIN)
    public ApiResponse<LoginResult> login(@RequestBody LoginRequest body, HttpServletRequest request) {
        String ip = ClientIp.of(request);
        var result = rateLimitService.executeLoginAttempt(ip,
                () -> adminAuthService.login(body.username(), body.password(), body.totpCode()));
        return result.map(ApiResponse::ok)
                .orElseThrow(() -> new UnauthorizedException("账号、密码或动态验证码错误"));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
        adminAuthService.logout(AdminAuthService.extractToken(authorization));
        return ApiResponse.ok();
    }

    @GetMapping("/me")
    public ApiResponse<Void> me() {
        return ApiResponse.ok();
    }

    public record LoginRequest(String username, String password, String totpCode) {}
}
