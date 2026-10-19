package work.huangxin.homepage.controller.admin;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import jakarta.validation.Valid;
import work.huangxin.homepage.common.ApiResponse;
import work.huangxin.homepage.domain.SortableEntity;
import work.huangxin.homepage.service.SortableCrudService;

/**
 * 列表类资源的通用后台接口：
 * GET 列表 / POST 新增 / PUT /{id} 修改 / DELETE /{id} 删除 / PUT /order 排序。
 * 鉴权由 AdminAuthInterceptor 按路径统一处理。
 */
public abstract class SortableAdminController<T extends SortableEntity> {

    private final SortableCrudService<T> service;

    protected SortableAdminController(SortableCrudService<T> service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<T>> list() {
        return ApiResponse.ok(service.listAll());
    }

    @PostMapping
    public ApiResponse<T> create(@Valid @RequestBody T body) {
        return ApiResponse.ok(service.create(body));
    }

    @PutMapping("/{id}")
    public ApiResponse<T> update(@PathVariable("id") Long id, @Valid @RequestBody T body) {
        return ApiResponse.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable("id") Long id) {
        service.delete(id);
        return ApiResponse.ok();
    }

    @PutMapping("/order")
    public ApiResponse<Void> reorder(@RequestBody List<Long> ids) {
        service.reorder(ids);
        return ApiResponse.ok();
    }
}
