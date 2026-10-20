package work.huangxin.homepage.controller;

import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.ApiResponse;
import work.huangxin.homepage.common.ClientIp;
import work.huangxin.homepage.common.exception.ForbiddenException;
import work.huangxin.homepage.ratelimit.RateLimit;
import work.huangxin.homepage.ratelimit.RateLimitService;
import work.huangxin.homepage.service.MessageService;
import work.huangxin.homepage.service.SiteService;

/**
 * 前台留言接口（公开）。
 */
@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final SiteService siteService;
    private final RateLimitService rateLimitService;

    @PostMapping
    @RateLimit(RateLimit.EXPENSIVE)
    public ApiResponse<Void> create(@Valid @RequestBody MessageForm form, HttpServletRequest request) {
        if (!siteService.getSiteData().profile().isMessageEnabled()) {
            throw new ForbiddenException("留言功能已关闭");
        }
        // 蜜罐字段：正常用户看不到这个输入框，机器人填了就假装成功
        if (StringUtils.hasText(form.website())) {
            return ApiResponse.ok();
        }
        String ip = ClientIp.of(request);
        rateLimitService.consumeMessage(ip);
        messageService.create(form.name(), form.contact(), form.content(), ip);
        return ApiResponse.ok();
    }

    public record MessageForm(
            @NotBlank(message = "请填写称呼")
            @Size(max = 30, message = "称呼最多 30 个字")
            String name,

            @Size(max = 100, message = "联系方式最多 100 个字")
            String contact,

            @NotBlank(message = "请填写留言内容")
            @Size(min = 2, max = 1000, message = "留言内容需在 2 到 1000 字之间")
            String content,

            String website) {
    }
}
