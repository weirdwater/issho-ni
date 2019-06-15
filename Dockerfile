FROM node:8 as build
WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn build:prod
RUN yarn webpack


FROM node:8 as runtime
WORKDIR /usr/src/app

COPY --from=build /usr/src/app/package.json \
                  /usr/src/app/yarn.lock    \
                  ./

RUN yarn install --production
RUN yarn cache clean

COPY --from=build /usr/src/app/dist/         ./dist/
COPY --from=build /usr/src/app/static/       ./dist/static

CMD yarn start:prod
