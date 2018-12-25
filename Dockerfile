FROM node:10.14.2-alpine 
# 编写dockerfile应该将不怎么改变的移动到上面
# 所以COPY .下移
RUN mkdir -p /root/blog

RUN node --version;\
    npm --version;

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh;

WORKDIR /root/blog

COPY . /root/blog

RUN npm install \
    && npm install typescript -g\
    && tsc;

EXPOSE 5000

CMD [ "node","./dist/index.js" ]
