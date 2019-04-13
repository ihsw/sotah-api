# building
FROM node:10-alpine

# copying in source
COPY ./app /srv/app
WORKDIR /srv/app

# adding deps
RUN apk --no-cache add --virtual native-deps \
  git g++ gcc libgcc libstdc++ linux-headers make python

# installing deps and building
RUN npm install node-gyp -g \
  && npm install \
  && npm rebuild bcrypt --build-from-source \
  && npm run -s build

# removing dev/build deps and installing only prod deps
RUN rm -rf ./node_modules \
  && npm install --only=production \
  && npm rebuild bcrypt --build-from-source

# slimming down the build
RUN npm cache clean --force \
  && apk del native-deps


# running
FROM node:10-alpine

# misc
ENV DB_HOST 0.0.0.0
ENV DB_PASSWORD=
ENV NATS_HOST 0.0.0.0
ENV NATS_PORT 0
ENV PORT 8080
ENV NODE_ENV=production

# copying in source
COPY ./app /srv/app
WORKDIR /srv/app

# copying in built app
COPY --from=0 /srv/app/dist ./dist
COPY --from=0 /srv/app/node_modules ./node_modules

CMD ["./bin/run-app-prod"]
