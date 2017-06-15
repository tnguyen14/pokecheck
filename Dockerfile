FROM mhart/alpine-node:8

RUN apk add --no-cache python g++ gcc make

COPY package.json /src/
COPY package-lock.json /src/

WORKDIR /src
RUN npm install

ADD server /src/server
ADD config /src/config

EXPOSE 3000

CMD ["npm", "start"]

