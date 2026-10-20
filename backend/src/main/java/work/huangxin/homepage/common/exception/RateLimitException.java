package work.huangxin.homepage.common.exception;

import lombok.Getter;

/**
 * 触发限流。retryAfterMillis 为建议的重试等待时间。
 */
@Getter
public class RateLimitException extends RuntimeException {

    private final long retryAfterMillis;

    public RateLimitException(String message, long retryAfterMillis) {
        super(message);
        this.retryAfterMillis = retryAfterMillis;
    }
}
