package work.huangxin.homepage.controller.admin;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import work.huangxin.homepage.domain.AiProject;
import work.huangxin.homepage.service.AiProjectService;

@RestController
@RequestMapping("/api/admin/ai-projects")
public class AiProjectAdminController extends SortableAdminController<AiProject> {
    public AiProjectAdminController(AiProjectService service) {
        super(service);
    }
}
