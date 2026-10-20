package work.huangxin.homepage.common;

import java.util.List;

/** 后台分页接口的统一返回结构。 */
public record PageResult<T>(List<T> items, long total, int page, int size, int totalPages) {
}
