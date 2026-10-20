package work.huangxin.homepage.common.exception;

/** 唯一键或业务状态冲突，统一映射为 HTTP 409。 */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
