package work.huangxin.homepage.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.ClientIp;
import work.huangxin.homepage.service.SiteService;

/**
 * 前台主页，服务端渲染（对 SEO 友好）。
 */
@Controller
@RequiredArgsConstructor
public class HomeController {

    private final SiteService siteService;

    @GetMapping({"/", "/index", "/index.html"})
    public String home(HttpServletRequest request, Model model) {
        siteService.recordView(ClientIp.of(request));
        model.addAttribute("site", siteService.getSiteData());
        return "index";
    }
}
