package work.huangxin.homepage.controller.admin;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import work.huangxin.homepage.domain.ContactLink;
import work.huangxin.homepage.service.ContactLinkService;

@RestController
@RequestMapping("/api/admin/contacts")
public class ContactAdminController extends SortableAdminController<ContactLink> {

    public ContactAdminController(ContactLinkService service) {
        super(service);
    }
}
