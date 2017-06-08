FROM mhart/alpine-node:8

COPY package.json /src/
COPY package-lock.json /src/

WORKDIR /src
RUN npm install

ADD server /src/server

EXPOSE 3000

CMD ["node_modules/.bin/pm2", "start", "server/index.js"]

