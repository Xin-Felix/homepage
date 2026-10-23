package work.huangxin.homepage.controller;

import java.util.List;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.ApiResponse;
import work.huangxin.homepage.common.ClientIp;
import work.huangxin.homepage.common.SiteLang;
import work.huangxin.homepage.domain.ContactLink;
import work.huangxin.homepage.domain.Experience;
import work.huangxin.homepage.domain.Profile;
import work.huangxin.homepage.domain.Project;
import work.huangxin.homepage.ratelimit.RateLimit;
import work.huangxin.homepage.service.SiteService;
import work.huangxin.homepage.service.SiteService.SiteData;
import work.huangxin.homepage.service.VisitService;
import work.huangxin.homepage.service.VisitService.VisitRequest;

/**
 * 供独立前端 SSR 服务使用的公开接口。
 * <p>
 * 只返回页面所需的白名单字段，避免直接序列化 JPA 实体导致未来新增字段意外公开。
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicSiteController {

    private final SiteService siteService;
    private final VisitService visitService;

    /** 获取主页快照，不产生访问记录。 */
    @GetMapping("/home")
    @RateLimit(RateLimit.CHEAP)
    public ResponseEntity<ApiResponse<PublicHome>> home(HttpServletRequest request) {
        SiteData site = siteService.getSiteData();
        PublicHome payload = PublicHome.from(site, siteService.getViewCount(), SiteLang.from(request));
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noCache())
                .body(ApiResponse.ok(payload));
    }

    /**
     * 由前端 SSR 服务在真实页面 GET 时调用；IP 和请求头只从可信代理链读取，不能由 body 伪造。
     */
    @PostMapping("/visits")
    @RateLimit(RateLimit.CHEAP)
    public ApiResponse<VisitCount> visit(@Valid @RequestBody VisitForm form, HttpServletRequest request) {
        long views = visitService.record(new VisitRequest(
                ClientIp.of(request), form.path(),
                request.getHeader("User-Agent"), request.getHeader("Referer")));
        return ApiResponse.ok(new VisitCount(views));
    }

    public record VisitForm(@Size(max = 100, message = "访问路径过长") String path) {
    }

    public record VisitCount(long views) {
    }

    public record PublicHome(
            ProfileView profile,
            List<ExperienceView> experiences,
            List<ProjectView> projects,
            List<ContactView> contacts,
            long views) {

        static PublicHome from(SiteData site, long views, SiteLang lang) {
            return new PublicHome(
                    ProfileView.from(site.profile(), lang),
                    site.experiences().stream().map(e -> ExperienceView.from(e, lang)).toList(),
                    site.projects().stream().map(p -> ProjectView.from(p, lang)).toList(),
                    site.contacts().stream().map(c -> ContactView.from(c, lang)).toList(),
                    views);
        }
    }

    public record ProfileView(
            String name, String siteTitle, String description, String keywords,
            String greeting, String intro, List<String> tags,
            List<String> aboutParagraphs, String footerText, boolean messageEnabled) {

        static ProfileView from(Profile p, SiteLang lang) {
            return new ProfileView(
                    lang.pick(p.getName(), p.getNameEn()),
                    lang.pick(p.getSiteTitle(), p.getSiteTitleEn()),
                    lang.pick(p.getDescription(), p.getDescriptionEn()),
                    lang.pick(p.getKeywords(), p.getKeywordsEn()),
                    lang.pick(p.getGreeting(), p.getGreetingEn()),
                    lang.pick(p.getIntro(), p.getIntroEn()),
                    lang.pickList(p.getTags(), p.getTagsEn()),
                    p.getAboutParagraphs(lang),
                    lang.pick(p.getFooterText(), p.getFooterTextEn()),
                    p.isMessageEnabled());
        }
    }

    public record ExperienceView(Long id, String period, String role, String org, String description) {
        static ExperienceView from(Experience e, SiteLang lang) {
            return new ExperienceView(e.getId(),
                    lang.pick(e.getPeriod(), e.getPeriodEn()),
                    lang.pick(e.getRole(), e.getRoleEn()),
                    lang.pick(e.getOrg(), e.getOrgEn()),
                    lang.pick(e.getDescription(), e.getDescriptionEn()));
        }
    }

    public record ProjectView(Long id, String slug, String name, String link, String description,
                              List<String> meta, boolean detailPublished) {
        static ProjectView from(Project p, SiteLang lang) {
            return new ProjectView(p.getId(), p.getSlug(),
                    lang.pick(p.getName(), p.getNameEn()), p.getLink(),
                    lang.pick(p.getDescription(), p.getDescriptionEn()),
                    lang.pickList(p.getMeta(), p.getMetaEn()), p.isDetailPublished());
        }
    }

    public record ContactView(Long id, String label, String text, String href, boolean external) {
        static ContactView from(ContactLink c, SiteLang lang) {
            return new ContactView(c.getId(),
                    lang.pick(c.getLabel(), c.getLabelEn()),
                    lang.pick(c.getText(), c.getTextEn()),
                    c.getHref(), c.isExternal());
        }
    }
}
