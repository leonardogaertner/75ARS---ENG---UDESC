FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY pom.xml .

COPY src ./src

RUN apk add --no-cache maven && \
    mvn clean package -DskipTests && \
    apk del maven

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "target/servico-pedidos-0.0.1-SNAPSHOT.jar"]
