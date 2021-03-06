FROM node:8-alpine as build
WORKDIR /usr/src/app

RUN apk add --update alpine-sdk python

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn build:prod
RUN yarn webpack

RUN rm -rf node_modules
RUN yarn install --production

FROM node:8-alpine as runtime
WORKDIR /usr/src/app

COPY --from=build /usr/src/app/package.json \
                  /usr/src/app/yarn.lock    \
                  ./

COPY --from=build /usr/src/app/node_modules/ ./node_modules/
COPY --from=build /usr/src/app/dist/         ./dist/
COPY --from=build /usr/src/app/static/       ./dist/static

ARG BUILD_NUMBER="none"
ARG GIT_BRANCH="none"
ARG GIT_COMMIT="none"
ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=$SENTRY_RELEASE
RUN echo "{ \"build\":\"${BUILD_NUMBER}\", \"branch\":\"${GIT_BRANCH}\", \"commit\":\"${GIT_COMMIT}\" }" > ./dist/static/build.json

CMD yarn start:prod
