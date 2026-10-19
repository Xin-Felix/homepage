package work.huangxin.homepage.common;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * 把 List&lt;String&gt; 以换行分隔存成一个字符串列，用于标签这类小列表，
 * 免去额外的关联表，同时兼容 H2 与 MySQL。
 */
@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

    private static final String SEPARATOR = "\n";

    @Override
    public String convertToDatabaseColumn(List<String> list) {
        if (list == null) {
            return "";
        }
        return list.stream()
                .filter(Objects::nonNull)
                .map(s -> s.replaceAll("[\\r\\n]+", " ").trim())
                .filter(s -> !s.isEmpty())
                .collect(Collectors.joining(SEPARATOR));
    }

    @Override
    public List<String> convertToEntityAttribute(String value) {
        if (value == null || value.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(value.split(SEPARATOR))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(ArrayList::new));
    }
}
