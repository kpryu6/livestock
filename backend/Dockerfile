# 1️⃣ Build Stage
FROM gradle:7.6.0-jdk17 AS build
WORKDIR /app
COPY . .
RUN ./gradlew clean build -x test

# 2️⃣ Run Stage
FROM openjdk:17-jdk-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]