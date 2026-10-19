package work.huangxin.homepage.service;

import org.springframework.stereotype.Service;

import work.huangxin.homepage.domain.Experience;
import work.huangxin.homepage.repository.ExperienceRepository;

@Service
public class ExperienceService extends SortableCrudService<Experience> {

    public ExperienceService(ExperienceRepository repository) {
        super(repository, "经历不存在");
    }
}
