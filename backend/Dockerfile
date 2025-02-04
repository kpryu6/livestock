# 1️⃣ Build Stage
FROM gradle:7.6-jdk17 AS build
WORKDIR /app
COPY . .
RUN gradle clean build -x test

# 2️⃣ Run Stage
FROM openjdk:17-jdk-slim
COPY --from=build /app/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]