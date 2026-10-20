package work.huangxin.homepage.domain;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import work.huangxin.homepage.common.StringListConverter;

/**
 * 开源与项目卡片。
 */
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

    @Size(max = 300, message = "链接最多 300 个字符")
    @Pattern(regexp = "^$|^https?://\\S+$", message = "链接需以 http:// 或 https:// 开头")
    @Column(length = 300)
    private String link;

    @Size(max = 1000, message = "描述最多 1000 个字")
    @Column(length = 1000)
    private String description;

    /** 卡片底部的小标签，如「Java / 微信小程序」「2020 — 2024」 */
    @Size(max = 8, message = "标签最多 8 个")
    @Convert(converter = StringListConverter.class)
    @Column(length = 500)
    private List<@Size(max = 40, message = "单个标签最多 40 个字") String> meta = new ArrayList<>();

    public static Project of(String name, String link, String description, List<String> meta) {
        Project p = new Project();
        p.setName(name);
        p.setLink(link);
        p.setDescription(description);
        p.setMeta(new ArrayList<>(meta));
        return p;
    }
}
