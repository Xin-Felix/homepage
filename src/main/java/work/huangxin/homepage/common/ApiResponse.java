package work.huangxin.homepage.common;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 统一接口返回结构，沿用原项目的 {"status": "success" | "error", ...} 约定。
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(String status, T data, String reason, Map<String, String> invalidFields) {

    private static final String SUCCESS = "success";
    private static final String ERROR = "error";

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(SUCCESS, data, null, null);
    }

    public static ApiResponse<Void> ok() {
        return new ApiResponse<>(SUCCESS, null, null, null);
    }

    public static ApiResponse<Void> error(String reason) {
        return new ApiResponse<>(ERROR, null, reason, null);
    }

    public static ApiResponse<Void> invalid(String reason, Map<String, String> invalidFields) {
        return new ApiResponse<>(ERROR, null, reason, invalidFields);
    }
}
