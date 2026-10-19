package work.huangxin.homepage.auth;

import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.exception.UnauthorizedException;

/**
 * 按路径统一拦截 /api/admin/**（登录接口除外）。
 * 原项目是在每个方法上加 @AuthorizeAdmin，这里改成路径级拦截，新增接口时不会漏加鉴权。
 */
@Component
@RequiredArgsConstructor
public class AdminAuthInterceptor implements HandlerInterceptor {

    private final AdminAuthService adminAuthService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = AdminAuthService.extractToken(request.getHeader(HttpHeaders.AUTHORIZATION));
        if (!adminAuthService.isValid(token)) {
            throw new UnauthorizedException("未登录或登录已过期");
        }
        return true;
    }
}
