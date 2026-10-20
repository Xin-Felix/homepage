package work.huangxin.homepage.controller.admin;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.common.ApiResponse;
import work.huangxin.homepage.common.PageResult;
import work.huangxin.homepage.domain.Message;
import work.huangxin.homepage.service.MessageService;

@RestController
@RequestMapping("/api/admin/messages")
@RequiredArgsConstructor
public class MessageAdminController {

    private final MessageService messageService;

    @GetMapping
    public ApiResponse<PageResult<Message>> list(@RequestParam(name = "page", defaultValue = "0") int page,
                                                 @RequestParam(name = "size", defaultValue = "20") int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        return ApiResponse.ok(messageService.list(safePage, safeSize));
    }

    @PutMapping("/{id}/read")
    public ApiResponse<Void> markRead(@PathVariable("id") Long id) {
        messageService.markRead(id);
        return ApiResponse.ok();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable("id") Long id) {
        messageService.delete(id);
        return ApiResponse.ok();
    }
}
