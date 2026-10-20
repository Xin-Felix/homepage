package work.huangxin.homepage.domain;

import java.time.LocalDateTime;

import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 单例 TOTP 凭据。secret 仅以 AES-GCM 密文保存；pending 与 active 分离，
 * 未确认的新设备不会覆盖当前可用凭据。
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "admin_totp_credential")
public class AdminTotpCredential {

    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id = SINGLETON_ID;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "active_ciphertext", length = 1000)
    private String activeCiphertext;

    @Column(name = "active_key_id", length = 40)
    private String activeKeyId;

    @Column(name = "pending_ciphertext", length = 1000)
    private String pendingCiphertext;

    @Column(name = "pending_key_id", length = 40)
    private String pendingKeyId;

    @Column(name = "pending_expires_at")
    private LocalDateTime pendingExpiresAt;

    @Column(name = "last_accepted_step", nullable = false)
    private long lastAcceptedStep = -1L;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    private long version;
}
