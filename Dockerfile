FROM node:8.4
MAINTAINER Andrew Zubko

RUN groupadd -r multivest && useradd -r -g multivest multivest

RUN mkdir /var/log/multivest
RUN chown -R multivest:multivest /var/log/multivest

RUN mkdir /project

WORKDIR /project

COPY ./ ./

RUN chown -R multivest:multivest /project/

VOLUME /project/log

USER multivest

EXPOSE 3000

ENTRYPOINT node dist/app