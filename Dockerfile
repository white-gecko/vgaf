FROM node:alpine

# from blinkmobile/bower MAINTAINER Ron Waldon <jokeyrhyme@gmail.com>

RUN npm install -g bower
RUN apk add --no-cache git

COPY configuration.json /usr/share/nginx/html/
COPY configuration.json.template /usr/share/nginx/html/
COPY index.html /usr/share/nginx/html/
COPY sampleRDF.json /usr/share/nginx/html/
COPY sampleTemplate.json /usr/share/nginx/html/
COPY .bowerrc /usr/share/nginx/html/
COPY bower.json /usr/share/nginx/html/

WORKDIR /usr/share/nginx/html/
RUN bower --allow-root install

VOLUME /usr/share/nginx/html
