package work.huangxin.homepage.controller.admin;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import work.huangxin.homepage.domain.Project;
import work.huangxin.homepage.service.ProjectService;

@RestController
@RequestMapping("/api/admin/projects")
public class ProjectAdminController extends SortableAdminController<Project> {

    public ProjectAdminController(ProjectService service) {
        super(service);
    }
}
