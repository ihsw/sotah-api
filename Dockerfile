FROM node:8

ENV DB_HOST 0.0.0.0
ENV NATS_HOST 0.0.0.0
ENV NATS_PORT 0
ENV APP_PORT 8080

COPY ./app /srv/app
WORKDIR /srv/app

RUN npm install -s \
  && npm run -s build

CMD ["./bin/run-app-prod"]
