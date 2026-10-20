package work.huangxin.homepage.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.ClientIp;
import work.huangxin.homepage.service.SiteService;
import work.huangxin.homepage.service.VisitService;
import work.huangxin.homepage.service.VisitService.VisitRequest;

/** 前台主页，服务端渲染（对 SEO 友好）。 */
@Controller
@RequiredArgsConstructor
public class HomeController {

    private final SiteService siteService;
    private final VisitService visitService;

    @GetMapping({"/", "/index", "/index.html"})
    public String home(HttpServletRequest request, Model model) {
        long views = "HEAD".equals(request.getMethod())
                ? siteService.getViewCount()
                : visitService.record(new VisitRequest(
                        ClientIp.of(request),
                        request.getRequestURI(),
                        request.getHeader("User-Agent"),
                        request.getHeader("Referer")));
        model.addAttribute("site", siteService.getSiteData());
        model.addAttribute("views", views);
        return "index";
    }
}
