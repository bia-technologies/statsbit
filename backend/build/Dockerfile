FROM openjdk:11-slim
WORKDIR /app
COPY newrelic.jar /app/newrelic.jar
COPY newrelic.yml /app/newrelic.yml
COPY app.jar /app/app.jar
CMD java -javaagent:newrelic.jar -cp app.jar clojure.main -m ru.bia-tech.statsbit.main
