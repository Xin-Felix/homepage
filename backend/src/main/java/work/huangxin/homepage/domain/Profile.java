package work.huangxin.homepage.domain;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import work.huangxin.homepage.common.SiteLang;
import work.huangxin.homepage.common.StringListConverter;

/**
 * 站点 / 个人基本信息，全站只有一行（id = 1）。
 * 合并了原项目的 Metadata（SEO、访问量）和 AboutMe。
 */
@Getter
@Setter
@NoArgsConstructor
@DynamicUpdate
@Entity
@Table(name = "profile")
public class Profile {

    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id = SINGLETON_ID;

    @NotBlank(message = "名字不能为空")
    @Size(max = 30, message = "名字最多 30 个字")
    @Column(nullable = false, length = 30)
    private String name = "";

    /** 名字英文版（可选，缺省回退中文）。 */
    @Size(max = 60, message = "名字英文版最多 60 个字符")
    @Column(name = "name_en", length = 60)
    private String nameEn;

    @NotBlank(message = "网页标题不能为空")
    @Size(max = 60, message = "网页标题最多 60 个字")
    @Column(name = "site_title", nullable = false, length = 60)
    private String siteTitle = "";

    @Size(max = 120, message = "网页标题英文版最多 120 个字符")
    @Column(name = "site_title_en", length = 120)
    private String siteTitleEn;

    @Size(max = 300, message = "SEO 描述最多 300 个字")
    @Column(length = 300)
    private String description;

    @Size(max = 400, message = "SEO 描述英文版最多 400 个字符")
    @Column(name = "description_en", length = 400)
    private String descriptionEn;

    @Size(max = 200, message = "SEO 关键词最多 200 个字")
    @Column(length = 200)
    private String keywords;

    @Size(max = 300, message = "SEO 关键词英文版最多 300 个字符")
    @Column(name = "keywords_en", length = 300)
    private String keywordsEn;

    @Size(max = 30, message = "问候语最多 30 个字")
    @Column(length = 30)
    private String greeting;

    @Size(max = 60, message = "问候语英文版最多 60 个字符")
    @Column(name = "greeting_en", length = 60)
    private String greetingEn;

    @NotBlank(message = "一句话介绍不能为空")
    @Size(max = 300, message = "一句话介绍最多 300 个字")
    @Column(nullable = false, length = 300)
    private String intro = "";

    @Size(max = 600, message = "一句话介绍英文版最多 600 个字符")
    @Column(name = "intro_en", length = 600)
    private String introEn;

    @Size(max = 20, message = "技能标签最多 20 个")
    @Convert(converter = StringListConverter.class)
    @Column(length = 1000)
    private List<@Size(max = 30, message = "单个技能标签最多 30 个字") String> tags = new ArrayList<>();

    /** 技能标签英文版（可选，缺省回退中文）。 */
    @Size(max = 20, message = "技能标签英文版最多 20 个")
    @Convert(converter = StringListConverter.class)
    @Column(name = "tags_en", length = 1200)
    private List<@Size(max = 50, message = "单个技能标签英文版最多 50 个字符") String> tagsEn = new ArrayList<>();

    @Size(max = 2000, message = "关于我最多 2000 个字")
    @Column(length = 2000)
    private String about;

    @Size(max = 4000, message = "关于我英文版最多 4000 个字符")
    @Column(name = "about_en", length = 4000)
    private String aboutEn;

    @Size(max = 100, message = "页脚文字最多 100 个字")
    @Column(name = "footer_text", length = 100)
    private String footerText;

    @Size(max = 200, message = "页脚文字英文版最多 200 个字符")
    @Column(name = "footer_text_en", length = 200)
    private String footerTextEn;

    /** 是否在主页开放留言 */
    @Column(name = "message_enabled", nullable = false)
    private boolean messageEnabled = true;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @Column(nullable = false)
    private Long views = 0L;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** 「关于我」按行拆成段落 */
    @JsonIgnore
    public List<String> getAboutParagraphs() {
        return splitParagraphs(about);
    }

    /** 按语言拆「关于我」段落；英文为空时回退中文。 */
    @JsonIgnore
    public List<String> getAboutParagraphs(SiteLang lang) {
        String text = lang != null ? lang.pick(about, aboutEn) : about;
        return splitParagraphs(text);
    }

    private static List<String> splitParagraphs(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        return Arrays.stream(text.split("\\R")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
}
