package work.huangxin.homepage.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 联系方式（GitHub / Email / 微信 ...）。href 为空时只显示文字。
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "contact_link")
public class ContactLink extends SortableEntity {

    @NotBlank(message = "名称不能为空")
    @Size(max = 20, message = "名称最多 20 个字")
    @Column(nullable = false, length = 20)
    private String label;

    @Size(max = 40, message = "名称英文版最多 40 个字符")
    @Column(name = "label_en", length = 40)
    private String labelEn;

    @NotBlank(message = "显示文字不能为空")
    @Size(max = 100, message = "显示文字最多 100 个字")
    @Column(nullable = false, length = 100)
    private String text;

    @Size(max = 200, message = "显示文字英文版最多 200 个字符")
    @Column(name = "text_en", length = 200)
    private String textEn;

    /** 只允许 http(s) / mailto / tel，防止 javascript: 之类的链接 */
    @Size(max = 300, message = "链接最多 300 个字符")
    @Pattern(regexp = "^$|^(https?://|mailto:|tel:)\\S+$", message = "链接需以 http://、https://、mailto: 或 tel: 开头")
    @Column(length = 300)
    private String href;

    /** 外部链接在新标签页打开 */
    @JsonIgnore
    public boolean isExternal() {
        return href != null && href.startsWith("http");
    }

    public static ContactLink of(String label, String text, String href) {
        ContactLink c = new ContactLink();
        c.setLabel(label);
        c.setText(text);
        c.setHref(href);
        return c;
    }
}
