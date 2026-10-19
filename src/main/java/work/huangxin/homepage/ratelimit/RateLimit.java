package work.huangxin.homepage.ratelimit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 接口限流注解（沿用原项目设计）：每次调用按 IP 从令牌桶里扣 value 个令牌。
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {

    long CHEAP = 1;
    long DEFAULT = 4;
    long ADMIN = 10;
    long EXPENSIVE = 50;

    long value() default DEFAULT;
}
