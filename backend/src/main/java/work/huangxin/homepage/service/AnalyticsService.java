package work.huangxin.homepage.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import lombok.RequiredArgsConstructor;
import work.huangxin.homepage.domain.VisitLog;
import work.huangxin.homepage.repository.VisitLogRepository;

/**
 * 在隐私化访问日志上做轻量聚合。个人站数据量较小，按时间范围读取后在 Java 中聚合，
 * 避免引入外部统计平台和额外分析数据库。
 */
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final VisitLogRepository visitLogRepository;

    @Transactional(readOnly = true)
    public Analytics overview(int requestedDays) {
        int days = requestedDays <= 7 ? 7 : requestedDays <= 30 ? 30 : 90;
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(days - 1L);
        List<VisitLog> logs = visitLogRepository
                .findAllByFirstVisitedAtGreaterThanEqualOrderByFirstVisitedAtAsc(start.atStartOfDay());

        Map<LocalDate, DailyAccumulator> byDay = new LinkedHashMap<>();
        for (int i = 0; i < days; i++) {
            byDay.put(start.plusDays(i), new DailyAccumulator());
        }
        long requests = 0;
        int[] hours = new int[24];
        for (VisitLog log : logs) {
            DailyAccumulator day = byDay.get(log.getFirstVisitedAt().toLocalDate());
            if (day != null) {
                day.unique++;
                day.requests += log.getHits();
            }
            requests += log.getHits();
            hours[log.getFirstVisitedAt().getHour()]++;
        }

        List<DailyPoint> daily = byDay.entrySet().stream()
                .map(entry -> new DailyPoint(entry.getKey(), entry.getValue().unique, entry.getValue().requests))
                .toList();
        List<HourPoint> hourly = new ArrayList<>(24);
        for (int hour = 0; hour < 24; hour++) hourly.add(new HourPoint(hour, hours[hour]));

        return new Analytics(
                days, logs.size(), requests, Math.max(0, requests - logs.size()), daily, hourly,
                rank(logs, log -> StringUtils.hasText(log.getReferer()) ? log.getReferer() : "直接访问"),
                rank(logs, VisitLog::getPath),
                rank(logs, log -> userAgentPart(log.getUserAgent(), 0, "其他浏览器")),
                rank(logs, log -> userAgentPart(log.getUserAgent(), 2, "未知设备")));
    }

    private static List<RankItem> rank(List<VisitLog> logs, Function<VisitLog, String> classifier) {
        Map<String, Long> counts = logs.stream().collect(Collectors.groupingBy(
                log -> normalize(classifier.apply(log)), Collectors.counting()));
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder())
                        .thenComparing(Map.Entry.comparingByKey()))
                .limit(8)
                .map(entry -> new RankItem(entry.getKey(), entry.getValue()))
                .toList();
    }

    private static String userAgentPart(String value, int index, String fallback) {
        if (!StringUtils.hasText(value)) return fallback;
        String[] parts = value.split(" · ");
        return parts.length > index ? parts[index] : value;
    }

    private static String normalize(String value) {
        return StringUtils.hasText(value) ? value : "未知";
    }

    private static final class DailyAccumulator {
        private long unique;
        private long requests;
    }

    public record Analytics(int days, long uniqueVisitors, long requests, long refreshes,
                            List<DailyPoint> daily, List<HourPoint> hourly,
                            List<RankItem> sources, List<RankItem> paths,
                            List<RankItem> browsers, List<RankItem> devices) {
    }

    public record DailyPoint(LocalDate date, long uniqueVisitors, long requests) {
    }

    public record HourPoint(int hour, long visitors) {
    }

    public record RankItem(String name, long value) {
    }
}
