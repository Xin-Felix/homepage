package work.huangxin.homepage.controller.admin;

import java.util.Optional;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.auth.AdminAuthService;
import work.huangxin.homepage.auth.AdminTotpService;
import work.huangxin.homepage.auth.AdminTotpService.TotpSetup;
import work.huangxin.homepage.auth.AdminTotpService.TotpStatus;
import work.huangxin.homepage.common.ApiResponse;
import work.huangxin.homepage.common.exception.ConflictException;
import work.huangxin.homepage.common.exception.UnauthorizedException;
import work.huangxin.homepage.ratelimit.RateLimit;
import work.huangxin.homepage.ratelimit.RateLimitService;

/** Bearer token 保护的 TOTP 设置接口；敏感操作再经过账户级 step-up 锁定。 */
@RestController
@RequestMapping("/api/admin/totp")
@RequiredArgsConstructor
public class AdminTotpController {

    private final AdminTotpService totpService;
    private final AdminAuthService authService;
    private final RateLimitService rateLimitService;

    @GetMapping("/status")
    public ApiResponse<TotpStatus> status() {
        return ApiResponse.ok(totpService.status());
    }

    @PostMapping("/setup")
    @RateLimit(RateLimit.EXPENSIVE)
    public ApiResponse<TotpSetup> setup(@RequestBody PasswordRequest body, HttpServletRequest request) {
        // 已启用时无论密码是什么都返回同一状态，避免用 409/401 枚举密码正确性。
        if (totpService.status().enabled()) throw new ConflictException("TOTP 已启用，请先停用后再重新绑定");
        Optional<TotpSetup> result = rateLimitService.executeStepUpAttempt(() ->
                authService.verifyPassword(body == null ? null : body.password())
                        ? Optional.of(totpService.startSetup()) : Optional.empty());
        return result.map(ApiResponse::ok)
                .orElseThrow(() -> new UnauthorizedException("密码或动态验证码错误"));
    }

    @PostMapping("/confirm")
    @RateLimit(RateLimit.EXPENSIVE)
    public ApiResponse<Void> confirm(@RequestBody CodeRequest body, HttpServletRequest request) {
        Optional<Boolean> result = rateLimitService.executeStepUpAttempt(() ->
                totpService.confirmIfValid(body == null ? null : body.code())
                        ? Optional.of(Boolean.TRUE) : Optional.empty());
        if (result.isEmpty()) throw new UnauthorizedException("密码或动态验证码错误");
        authService.invalidateAllTokens();
        return ApiResponse.ok();
    }

    @PostMapping("/disable")
    @RateLimit(RateLimit.EXPENSIVE)
    public ApiResponse<Void> disable(@RequestBody DisableRequest body, HttpServletRequest request) {
        boolean passwordValid = authService.verifyPassword(body == null ? null : body.password());
        String code = body == null ? null : body.code();
        Optional<Boolean> result = rateLimitService.executeStepUpAttempt(() ->
                totpService.disableIfValid(code, passwordValid)
                        ? Optional.of(Boolean.TRUE) : Optional.empty());
        if (result.isEmpty()) throw new UnauthorizedException("密码或动态验证码错误");
        authService.invalidateAllTokens();
        return ApiResponse.ok();
    }

    public record PasswordRequest(String password) {}
    public record CodeRequest(String code) {}
    public record DisableRequest(String password, String code) {}
}
