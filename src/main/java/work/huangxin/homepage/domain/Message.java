package work.huangxin.homepage.domain;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

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
 * 访客留言。
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "message", indexes = @Index(name = "idx_message_read", columnList = "is_read"))
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(length = 100)
    private String contact;

    @Column(nullable = false, length = 1000)
    private String content;

    /** read 是 MySQL 保留字，列名用 is_read */
    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    /** IP 摘要，后台用来识别同一来源的刷屏 */
    @Column(name = "ip_hash", length = 16)
    private String ipHash;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
