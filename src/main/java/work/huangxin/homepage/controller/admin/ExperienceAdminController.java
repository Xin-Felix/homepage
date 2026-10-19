package work.huangxin.homepage.controller.admin;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import work.huangxin.homepage.domain.Experience;
import work.huangxin.homepage.service.ExperienceService;

@RestController
@RequestMapping("/api/admin/experiences")
public class ExperienceAdminController extends SortableAdminController<Experience> {

    public ExperienceAdminController(ExperienceService service) {
        super(service);
    }
}
