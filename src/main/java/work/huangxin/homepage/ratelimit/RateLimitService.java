package work.huangxin.homepage.ratelimit;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.EstimationProbe;
import work.huangxin.homepage.common.exception.RateLimitException;
import work.huangxin.homepage.config.HomepageProperties;

/**
 * 基于 Bucket4j 的按 IP 限流，分三类：普通接口、登录失败、留言。
 * 桶放在 Caffeine 里，一段时间不访问自动过期（原项目用的是 Guava LoadingCache）。
 */
@Service
public class RateLimitService {

    private final Limiter requests;
    private final Limiter loginFailures;
    private final Limiter messages;

    public RateLimitService(HomepageProperties properties) {
        HomepageProperties.RateLimit cfg = properties.rateLimit();
        this.requests = new Limiter(cfg.capacity(), cfg.period());
        this.loginFailures = new Limiter(cfg.loginFailures(), cfg.loginPeriod());
        this.messages = new Limiter(cfg.messages(), cfg.messagePeriod());
    }

    /** 普通接口限流，tokens 为本次请求的“花费”。 */
    public void consume(String ip, long tokens) {
        requests.consume(ip, tokens, "请求过于频繁");
    }

    /** 登录前检查：失败次数是否已用完（不扣减）。 */
    public void checkLoginAllowed(String ip) {
        EstimationProbe probe = loginFailures.bucket(ip).estimateAbilityToConsume(1);
        if (!probe.canBeConsumed()) {
            throw new RateLimitException("登录失败次数过多", toMillis(probe.getNanosToWaitForRefill()));
        }
    }

    /** 记录一次登录失败。 */
    public void recordLoginFailure(String ip) {
        loginFailures.bucket(ip).tryConsume(1);
    }

    /** 留言限流。 */
    public void consumeMessage(String ip) {
        messages.consume(ip, 1, "留言太频繁了");
    }

    private static long toMillis(long nanos) {
        return TimeUnit.NANOSECONDS.toMillis(nanos);
    }

    private static final class Limiter {

        private final long capacity;
        private final Duration period;
        private final Cache<String, Bucket> buckets;

        Limiter(long capacity, Duration period) {
            this.capacity = capacity;
            this.period = period;
            // 桶在补满所需时间之后过期即可，再访问时重新创建，结果等价
            this.buckets = Caffeine.newBuilder()
                    .expireAfterAccess(period.plusMinutes(1))
                    .maximumSize(100_000)
                    .build();
        }

        Bucket bucket(String key) {
            return buckets.get(key, k -> Bucket.builder()
                    .addLimit(Bandwidth.builder().capacity(capacity).refillGreedy(capacity, period).build())
                    .build());
        }

        void consume(String key, long tokens, String message) {
            ConsumptionProbe probe = bucket(key).tryConsumeAndReturnRemaining(tokens);
            if (!probe.isConsumed()) {
                throw new RateLimitException(message, toMillis(probe.getNanosToWaitForRefill()));
            }
        }
    }
}
