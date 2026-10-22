package work.huangxin.homepage.domain;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 一次经过 IP 窗口去重的主页访问记录。
 * 同一窗口内的刷新只更新 hits 和 lastVisitedAt，不会新增记录或增加总访问量。
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "visit_log", indexes = {
        @Index(name = "idx_visit_log_ip_hash", columnList = "ip_hash"),
        @Index(name = "idx_visit_log_first_at", columnList = "first_visited_at"),
        @Index(name = "idx_visit_log_last_at", columnList = "last_visited_at")
})
public class VisitLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 使用服务端盐值计算的 SHA-256 指纹，供 24 小时去重，不经 admin API 输出完整值。 */
    @JsonIgnore
    @Column(name = "ip_hash", nullable = false, length = 64)
    private String ipHash;

    /** 历史兼容字段：保留脱敏网段，旧记录无法恢复为完整 IP。 */
    @JsonIgnore
    @Column(name = "ip_masked", nullable = false, length = 64)
    private String ipMasked;

    /** 新记录保存可信代理链解析后的完整数值 IP；仅管理员访问日志 API 可见。 */
    @JsonIgnore
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /** 新记录创建时通过本地离线库查询的国家 / 省市快照。 */
    @Column(length = 128)
    private String region;

    @Column(nullable = false, length = 100)
    private String path;

    @Column(name = "user_agent", length = 100)
    private String userAgent;

    @Column(length = 300)
    private String referer;

    /** 本次去重窗口内主页请求总数，包含刷新。 */
    @Column(nullable = false)
    private long hits = 1L;

    @Column(name = "first_visited_at", nullable = false, updatable = false)
    private LocalDateTime firstVisitedAt;

    @Column(name = "last_visited_at", nullable = false)
    private LocalDateTime lastVisitedAt;
}
