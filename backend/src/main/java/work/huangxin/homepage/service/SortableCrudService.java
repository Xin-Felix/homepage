package work.huangxin.homepage.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.BeanUtils;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.transaction.annotation.Transactional;

import work.huangxin.homepage.common.exception.NotFoundException;
import work.huangxin.homepage.domain.SortableEntity;
import work.huangxin.homepage.repository.SortableRepository;

/**
 * 经历 / 项目 / 联系方式共用的增删改查与排序逻辑。任何写操作都会清掉主页缓存。
 */
public abstract class SortableCrudService<T extends SortableEntity> {

    /** 这些字段由服务端维护，不接受前端传入 */
    private static final String[] SERVER_MANAGED = {"id", "sortOrder"};

    protected final SortableRepository<T> repository;
    private final String notFoundMessage;

    protected SortableCrudService(SortableRepository<T> repository, String notFoundMessage) {
        this.repository = repository;
        this.notFoundMessage = notFoundMessage;
    }

    @Transactional(readOnly = true)
    public List<T> listAll() {
        return repository.findAllByOrderBySortOrderAscIdAsc();
    }

    @Transactional(readOnly = true)
    public long count() {
        return repository.count();
    }

    @Transactional
    @CacheEvict(cacheNames = SiteService.CACHE, allEntries = true)
    public T create(T input) {
        input.setId(null);
        input.setSortOrder(repository.maxSortOrder() + 1);
        return repository.save(input);
    }

    @Transactional
    @CacheEvict(cacheNames = SiteService.CACHE, allEntries = true)
    public T update(Long id, T input) {
        T entity = repository.findById(id).orElseThrow(() -> new NotFoundException(notFoundMessage));
        BeanUtils.copyProperties(input, entity, SERVER_MANAGED);
        return repository.save(entity);
    }

    @Transactional
    @CacheEvict(cacheNames = SiteService.CACHE, allEntries = true)
    public void delete(Long id) {
        T entity = repository.findById(id).orElseThrow(() -> new NotFoundException(notFoundMessage));
        repository.delete(entity);
    }

    /**
     * 按传入的 id 顺序重排；没传到的条目保持原有相对顺序排在后面。
     */
    @Transactional
    @CacheEvict(cacheNames = SiteService.CACHE, allEntries = true)
    public void reorder(List<Long> ids) {
        List<T> all = repository.findAllByOrderBySortOrderAscIdAsc();
        Map<Long, T> rest = new LinkedHashMap<>();
        all.forEach(e -> rest.put(e.getId(), e));

        List<T> ordered = new ArrayList<>(all.size());
        for (Long id : ids) {
            T entity = rest.remove(id);
            if (entity == null) {
                throw new NotFoundException("排序列表里有不存在或重复的条目，请刷新后重试");
            }
            ordered.add(entity);
        }
        ordered.addAll(rest.values());
        for (int i = 0; i < ordered.size(); i++) {
            ordered.get(i).setSortOrder(i + 1);
        }
        repository.saveAll(ordered);
    }
}
