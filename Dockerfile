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

CMD yarn start:prod
