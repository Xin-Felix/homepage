package work.huangxin.homepage.common;

import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 公开接口的展示语言。
 * <p>
 * 中文是站点的权威内容，英文为可选翻译；当某个英文字段缺失时回退到中文，
 * 保证双语站点在英文内容尚未补全时也不会出现空白。
 * <p>
 * 语言信号由前端 SSR 服务依据 {@code /en} 前缀注入请求头 {@code X-Site-Lang}，
 * 后端不直接解析 Accept-Language，避免缓存与爬虫判定复杂化。
 */
public enum SiteLang {

    ZH,
    EN;

    /** 前端注入的语言请求头；缺省视为中文。 */
    public static final String HEADER = "X-Site-Lang";

    public static SiteLang from(HttpServletRequest request) {
        return request == null ? ZH : fromHeader(request.getHeader(HEADER));
    }

    public static SiteLang fromHeader(String value) {
        return value != null && value.trim().equalsIgnoreCase("en") ? EN : ZH;
    }

    public boolean isEnglish() {
        return this == EN;
    }

    /**
     * 按当前语言在中/英文本之间选择；英文为空时回退中文。
     *
     * @param zh 中文文本（权威内容）
     * @param en 英文文本（可选）
     */
    public String pick(String zh, String en) {
        if (this == EN && en != null && !en.isBlank()) {
            return en;
        }
        return zh;
    }

    /**
     * 按当前语言在中/英文列表之间选择；英文列表为空时回退中文列表。
     */
    public List<String> pickList(List<String> zh, List<String> en) {
        if (this == EN && en != null && !en.isEmpty()) {
            return List.copyOf(en);
        }
        return zh == null ? List.of() : List.copyOf(zh);
    }
}
