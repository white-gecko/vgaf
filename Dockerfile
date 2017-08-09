FROM node

RUN npm install -g grunt

WORKDIR /var/docker/rdforms

RUN git clone https://bitbucket.org/metasolutions/rdforms.git .
RUN git submodule init && \
  git submodule update
COPY rdforms/bower.json .
COPY rdforms/Gruntfile.js .
COPY rdforms/config/deps.js ./config/
RUN npm install --allow-root
RUN grunt build

WORKDIR /usr/share/nginx/html

COPY configuration.json .
COPY configuration.json.template .
COPY index.html .
COPY quitedit.js .
COPY sampleRDF.json .
COPY sampleTemplate.json .
RUN cp -r /var/docker/rdforms/* ./.

VOLUME /usr/share/nginx/html
VOLUME /var/docker
