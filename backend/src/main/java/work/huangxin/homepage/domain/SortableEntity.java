package work.huangxin.homepage.domain;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;

/**
 * 可排序、可隐藏的列表项（经历 / 项目 / 联系方式）的公共字段。
 */
@Getter
@Setter
@MappedSuperclass
public abstract class SortableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 越小越靠前 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    /** 是否在主页显示 */
    @Column(nullable = false)
    private boolean visible = true;
}
