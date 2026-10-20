package work.huangxin.homepage.service;

import org.springframework.stereotype.Service;

import work.huangxin.homepage.domain.Project;
import work.huangxin.homepage.repository.ProjectRepository;

@Service
public class ProjectService extends SortableCrudService<Project> {

    public ProjectService(ProjectRepository repository) {
        super(repository, "项目不存在");
    }
}
