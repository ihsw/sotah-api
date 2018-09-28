# building
FROM node:10-alpine

# copying in source
COPY ./app /srv/app
WORKDIR /srv/app

# installing deps and building
RUN npm install -s \
  && npm run -s build \
  && rm -rf ./node_modules \
  && npm install -s --only=production


# running
FROM node:10-alpine

# misc
ENV DB_HOST 0.0.0.0
ENV NATS_HOST 0.0.0.0
ENV NATS_PORT 0
ENV APP_PORT 8080

# copying in source
COPY ./app /srv/app
WORKDIR /srv/app

# copying in built app
COPY --from=0 /srv/app/dist ./dist
COPY --from=0 /srv/app/node_modules ./node_modules

CMD ["./bin/run-app-prod"]
