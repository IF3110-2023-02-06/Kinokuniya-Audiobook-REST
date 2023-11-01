FROM node:latest
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn

COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate

CMD [ "yarn", "run", "start:dev" ]

EXPOSE 3000