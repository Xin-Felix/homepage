package work.huangxin.homepage.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 工作 / 教育经历。时间用自由文本（如「2022.07 — 至今」），排序靠 sortOrder，
 * 比原项目的 MM/YYYY + 自动排序更贴合中文简历的写法。
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "experience")
public class Experience extends SortableEntity {

    @NotBlank(message = "时间不能为空")
    @Size(max = 50, message = "时间最多 50 个字")
    @Column(nullable = false, length = 50)
    private String period;

    @NotBlank(message = "职位不能为空")
    @Size(max = 50, message = "职位最多 50 个字")
    @Column(nullable = false, length = 50)
    private String role;

    @Size(max = 50, message = "公司 / 组织最多 50 个字")
    @Column(length = 50)
    private String org;

    @Size(max = 1000, message = "描述最多 1000 个字")
    @Column(length = 1000)
    private String description;

    public static Experience of(String period, String role, String org, String description) {
        Experience e = new Experience();
        e.setPeriod(period);
        e.setRole(role);
        e.setOrg(org);
        e.setDescription(description);
        return e;
    }
}
