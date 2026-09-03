FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package spring-boot:repackage -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
# Explicitly copy the jar that contains the main class, excluding plain jar
RUN find target -maxdepth 1 -name "*.jar" ! -name "*-plain.jar" -copy 2>/dev/null || true
COPY --from=build /app/target/*[!.][!n].jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]
