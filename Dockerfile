FROM node:20.8.0-alpine3.17 as base

WORKDIR /src

COPY ./src/package.json ./ 

RUN npm install

COPY ./src ./ 

CMD npm run dev

# To keep container active for testing
# ENTRYPOINT ["tail", "-f", "/dev/null"]