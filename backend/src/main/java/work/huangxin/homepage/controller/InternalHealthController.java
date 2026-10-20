package work.huangxin.homepage.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.service.SiteService;

/** 仅供容器内健康检查使用；backend 不映射到宿主端口。 */
@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
public class InternalHealthController {

    private final SiteService siteService;

    @GetMapping("/health")
    public Map<String, Object> health() {
        // 读取数据库可同时验证 Web 进程与数据连接是否就绪。
        return Map.of("status", "UP", "views", siteService.getViewCount());
    }
}
