FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY pom.xml .

COPY src ./src

RUN apk add --no-cache maven && \
    mvn clean package -DskipTests && \
    apk del maven

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "target/servico-produtos-0.0.1-SNAPSHOT.jar"]
