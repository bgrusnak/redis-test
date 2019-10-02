FROM node:10.16.3-alpine
RUN npm install -g nodemon
# Create app directory
WORKDIR /usr/app

COPY . .

RUN npm config set registry 'https://registry.npm.taobao.org/' \
    && npm install

EXPOSE 5200

# CMD [ "node", "index.js" ]
