package work.huangxin.homepage.domain;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import work.huangxin.homepage.common.StringListConverter;

/** AI Lab 项目；默认不公开，准备好内容后由后台显式发布。 */
@Getter
@Setter
@Entity
@Table(name = "ai_project")
public class AiProject extends SortableEntity {

    public enum Status { IDEA, BUILDING, LIVE, ARCHIVED }

    public AiProject() {
        setVisible(false);
    }

    @NotBlank(message = "项目名称不能为空")
    @Size(max = 100, message = "项目名称最多 100 个字")
    @Column(nullable = false, length = 100)
    private String title;

    @Size(max = 100, message = "路径最多 100 个字符")
    @Pattern(regexp = "^$|^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "路径只能包含小写字母、数字和连字符")
    @Column(unique = true, length = 100)
    private String slug;

    @NotBlank(message = "摘要不能为空")
    @Size(max = 500, message = "摘要最多 500 个字")
    @Column(nullable = false, length = 500)
    private String summary;

    @NotNull(message = "请选择项目状态")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.IDEA;

    @Size(max = 100, message = "模型说明最多 100 个字")
    @Column(length = 100)
    private String models;

    @Size(max = 12, message = "技术栈最多 12 个")
    @Convert(converter = StringListConverter.class)
    @Column(length = 600)
    private List<@Size(max = 40, message = "单个技术项最多 40 个字") String> stack = new ArrayList<>();

    @Size(max = 300, message = "演示链接最多 300 个字符")
    @Pattern(regexp = "^$|^https?://\\S+$", message = "演示链接需以 http:// 或 https:// 开头")
    @Column(name = "demo_url", length = 300)
    private String demoUrl;

    @Size(max = 300, message = "仓库链接最多 300 个字符")
    @Pattern(regexp = "^$|^https?://\\S+$", message = "仓库链接需以 http:// 或 https:// 开头")
    @Column(name = "repo_url", length = 300)
    private String repoUrl;

    @Lob
    @Size(max = 100_000, message = "Markdown 正文最多 100000 个字")
    @Column(name = "content_markdown", columnDefinition = "TEXT")
    private String contentMarkdown;

    @JsonIgnore
    @AssertTrue(message = "公开 AI 项目前必须填写路径和 Markdown 正文")
    public boolean isPublishComplete() {
        return !isVisible() || (hasText(slug) && hasText(contentMarkdown));
    }

    @PrePersist
    @PreUpdate
    void normalize() {
        if (slug != null) {
            slug = slug.trim().toLowerCase(Locale.ROOT);
            if (slug.isEmpty()) slug = null;
        }
        if (demoUrl != null && demoUrl.isBlank()) demoUrl = null;
        if (repoUrl != null && repoUrl.isBlank()) repoUrl = null;
    }

    public static List<String> validStatuses() {
        return Arrays.stream(Status.values()).map(Enum::name).toList();
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
