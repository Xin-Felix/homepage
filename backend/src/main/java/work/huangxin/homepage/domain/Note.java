package work.huangxin.homepage.domain;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import work.huangxin.homepage.common.StringListConverter;

/** 技术笔记；正文使用 Markdown，published=false 时仅后台可见。 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "note", indexes = {
        @Index(name = "idx_note_published_at", columnList = "published,published_at"),
        @Index(name = "idx_note_slug", columnList = "slug", unique = true)
})
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "标题不能为空")
    @Size(max = 120, message = "标题最多 120 个字")
    @Column(nullable = false, length = 120)
    private String title;

    @NotBlank(message = "路径不能为空")
    @Size(max = 100, message = "路径最多 100 个字符")
    @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "路径只能包含小写字母、数字和连字符")
    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @NotBlank(message = "摘要不能为空")
    @Size(max = 500, message = "摘要最多 500 个字")
    @Column(nullable = false, length = 500)
    private String summary;

    @Size(max = 10, message = "标签最多 10 个")
    @Convert(converter = StringListConverter.class)
    @Column(length = 500)
    private List<@Size(max = 30, message = "单个标签最多 30 个字") String> tags = new ArrayList<>();

    @Lob
    @NotBlank(message = "Markdown 正文不能为空")
    @Size(max = 100_000, message = "正文最多 100000 个字")
    @Column(name = "content_markdown", nullable = false, columnDefinition = "TEXT")
    private String contentMarkdown;

    @Column(nullable = false)
    private boolean published = false;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @Column(name = "read_count", nullable = false)
    private long readCount = 0L;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void normalize() {
        if (slug != null) slug = slug.trim().toLowerCase(Locale.ROOT);
    }
}
