package work.huangxin.homepage.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.service.SiteService;

/**
 * 前台主页，服务端渲染（对 SEO 友好）。
 */
@Controller
@RequiredArgsConstructor
public class HomeController {

    private final SiteService siteService;

    @GetMapping({"/", "/index", "/index.html"})
    public String home(Model model) {
        long views = siteService.recordView();
        model.addAttribute("site", siteService.getSiteData());
        model.addAttribute("views", views);
        return "index";
    }
}
