package work.huangxin.homepage.domain;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import work.huangxin.homepage.common.StringListConverter;

/** 首页项目卡片及可选的 Markdown 案例详情。 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "project")
public class Project extends SortableEntity {

    @NotBlank(message = "项目名称不能为空")
    @Size(max = 50, message = "项目名称最多 50 个字")
    @Column(nullable = false, length = 50)
    private String name;

    @Size(max = 80, message = "项目路径最多 80 个字符")
    @Pattern(regexp = "^$|^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "项目路径只能包含小写字母、数字和连字符")
    @Column(unique = true, length = 80)
    private String slug;

    @Size(max = 300, message = "链接最多 300 个字符")
    @Pattern(regexp = "^$|^https?://\\S+$", message = "链接需以 http:// 或 https:// 开头")
    @Column(length = 300)
    private String link;

    @Size(max = 1000, message = "描述最多 1000 个字")
    @Column(length = 1000)
    private String description;

    @Size(max = 100, message = "项目角色最多 100 个字")
    @Column(length = 100)
    private String role;

    @Size(max = 50, message = "项目时间最多 50 个字")
    @Column(length = 50)
    private String period;

    /** 卡片底部的小标签，如「Java / Spring Boot」「2024 — 至今」。 */
    @Size(max = 8, message = "标签最多 8 个")
    @Convert(converter = StringListConverter.class)
    @Column(length = 500)
    private List<@Size(max = 40, message = "单个标签最多 40 个字") String> meta = new ArrayList<>();

    @Lob
    @Size(max = 50_000, message = "项目详情最多 50000 个字")
    @Column(name = "content_markdown", columnDefinition = "TEXT")
    private String contentMarkdown;

    /** 首页卡片可见与详情发布分开控制，方便先写草稿。 */
    @Column(name = "detail_published", nullable = false)
    private boolean detailPublished = false;

    @JsonIgnore
    @AssertTrue(message = "发布项目详情前必须填写项目路径和 Markdown 内容")
    public boolean isDetailComplete() {
        return !detailPublished || (hasText(slug) && hasText(contentMarkdown));
    }

    @PrePersist
    @PreUpdate
    void normalize() {
        if (slug != null) {
            slug = slug.trim().toLowerCase(Locale.ROOT);
            if (slug.isEmpty()) slug = null;
        }
        if (link != null && link.isBlank()) link = null;
    }

    public static Project of(String name, String link, String description, List<String> meta) {
        Project p = new Project();
        p.setName(name);
        p.setLink(link);
        p.setDescription(description);
        p.setMeta(new ArrayList<>(meta));
        return p;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
