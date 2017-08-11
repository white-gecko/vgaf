FROM node:alpine

RUN npm install -g grunt && apk add --no-cache git

WORKDIR /usr/share/nginx/html

RUN git clone --branch develop --depth 1 https://bitbucket.org/metasolutions/rdforms.git . && \
  git submodule init && \
  git submodule update

COPY rdforms .

RUN npm install --allow-root && grunt build

COPY data/* ./

VOLUME /usr/share/nginx/html
