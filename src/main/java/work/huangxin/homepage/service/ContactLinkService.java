package work.huangxin.homepage.service;

import org.springframework.stereotype.Service;

import work.huangxin.homepage.domain.ContactLink;
import work.huangxin.homepage.repository.ContactLinkRepository;

@Service
public class ContactLinkService extends SortableCrudService<ContactLink> {

    public ContactLinkService(ContactLinkRepository repository) {
        super(repository, "联系方式不存在");
    }
}
