package work.huangxin.homepage.ratelimit;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

import org.springframework.stereotype.Service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import work.huangxin.homepage.common.exception.RateLimitException;
import work.huangxin.homepage.config.HomepageProperties;

/**
 * 普通请求和留言使用 Bucket4j；后台登录在每个 IP 的互斥区内完成验证与失败记账。
 */
@Service
public class RateLimitService {

    private final Limiter requests;
    private final Limiter messages;
    private final Cache<String, LoginFailureState> loginFailures;
    private final long maxLoginFailures;
    private final Duration loginLockDuration;

    public RateLimitService(HomepageProperties properties) {
        HomepageProperties.RateLimit cfg = properties.rateLimit();
        this.requests = new Limiter(cfg.capacity(), cfg.period());
        this.messages = new Limiter(cfg.messages(), cfg.messagePeriod());
        this.maxLoginFailures = cfg.loginFailures();
        this.loginLockDuration = cfg.loginPeriod();
        this.loginFailures = Caffeine.newBuilder()
                .expireAfterAccess(loginLockDuration.plusMinutes(1))
                .maximumSize(100_000)
                .build();
    }

    /** 普通接口限流，tokens 为本次请求的“花费”。 */
    public void consume(String ip, long tokens) {
        requests.consume(ip, tokens, "请求过于频繁");
    }

    /**
     * 串行化同一 IP 的“检查锁定 → 校验凭据 → 记录结果”，并发请求无法越过失败上限。
     * 成功会清除失败状态；失败达到上限后，从该次失败起锁定完整周期。
     */
    public <T> Optional<T> executeLoginAttempt(String ip, Supplier<Optional<T>> credentialVerifier) {
        LoginFailureState state = loginFailures.get(ip, key -> new LoginFailureState());
        synchronized (state) {
            Instant now = Instant.now();
            if (state.lockedUntil != null && state.lockedUntil.isAfter(now)) {
                long waitMillis = Duration.between(now, state.lockedUntil).toMillis();
                throw new RateLimitException("登录失败次数过多", Math.max(1, waitMillis));
            }
            if (state.lockedUntil != null) {
                state.reset();
            }

            Optional<T> result = credentialVerifier.get();
            if (result.isPresent()) {
                state.reset();
                return result;
            }

            state.failures++;
            if (state.failures >= maxLoginFailures) {
                state.lockedUntil = now.plus(loginLockDuration);
            }
            return Optional.empty();
        }
    }

    /** 留言限流。 */
    public void consumeMessage(String ip) {
        messages.consume(ip, 1, "留言太频繁了");
    }

    private static long toMillis(long nanos) {
        return TimeUnit.NANOSECONDS.toMillis(nanos);
    }

    private static final class LoginFailureState {
        private long failures;
        private Instant lockedUntil;

        void reset() {
            failures = 0;
            lockedUntil = null;
        }
    }

    private static final class Limiter {

        private final long capacity;
        private final Duration period;
        private final Cache<String, Bucket> buckets;

        Limiter(long capacity, Duration period) {
            this.capacity = capacity;
            this.period = period;
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
