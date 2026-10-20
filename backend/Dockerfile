# syntax=docker/dockerfile:1

# 构建阶段完全在容器内完成，不依赖宿主机的 JDK 或 Maven。
FROM maven:3.9.16-eclipse-temurin-17 AS build
WORKDIR /src
COPY pom.xml .
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q -DskipTests package \
    && cp target/homepage-*.jar /app.jar

FROM eclipse-temurin:17.0.20_8-jre-noble
ENV TZ=Asia/Shanghai
RUN useradd --uid 10001 --no-create-home --shell /usr/sbin/nologin app
WORKDIR /app
COPY --from=build /app.jar /app/app.jar
USER app
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=4s --start-period=40s --retries=5 \
    CMD curl -fsS http://127.0.0.1:8080/internal/health >/dev/null || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
