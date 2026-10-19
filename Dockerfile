# syntax=docker/dockerfile:1

# ---- 构建阶段：在容器里用 Maven 打包，不依赖本机的 JDK / Maven ----
FROM maven:3.9.16-eclipse-temurin-17 AS build
WORKDIR /src
COPY pom.xml .
COPY src ./src
# ~/.m2 用 BuildKit 缓存挂载，改代码后重新构建不用重复下载依赖
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q -DskipTests package \
    && cp target/homepage-*.jar /app.jar

# ---- 运行阶段：只带 JRE ----
FROM eclipse-temurin:17.0.20_8-jre-noble
ENV TZ=Asia/Shanghai
RUN useradd --uid 10001 --no-create-home --shell /usr/sbin/nologin app
WORKDIR /app
COPY --from=build /app.jar /app/app.jar
USER app
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=40s --retries=5 \
    CMD curl -fsS -o /dev/null http://127.0.0.1:8080/robots.txt || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
