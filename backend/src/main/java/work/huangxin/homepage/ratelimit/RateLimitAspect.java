package work.huangxin.homepage.ratelimit;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.ClientIp;

/**
 * 处理 {@link RateLimit} 注解。相比原项目，改为从 RequestContextHolder 取请求，
 * 业务方法不再需要显式声明 HttpServletRequest 参数。
 */
@Aspect
@Component
@RequiredArgsConstructor
public class RateLimitAspect {

    private final RateLimitService rateLimitService;

    @Around("@annotation(rateLimit)")
    public Object around(ProceedingJoinPoint joinPoint, RateLimit rateLimit) throws Throwable {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            rateLimitService.consume(ClientIp.of(attributes.getRequest()), rateLimit.value());
        }
        return joinPoint.proceed();
    }
}
