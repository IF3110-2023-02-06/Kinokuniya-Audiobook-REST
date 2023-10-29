import { DataSourceOptions } from "typeorm";

import { User } from "../models/user-model";
import { Book } from "../models/book-model";
import { UserSubscriber } from "../subscribers/user-subscriber";

const generateMySQLHost = () => {
    return process.env.MYSQL_HOST ? process.env.MYSQL_HOST : "localhost";
};

const generateMySQLPort = () => {
    return process.env.MYSQL_PORT ? +process.env.MYSQL_PORT : 5432;
};

const generateMySQLUsername = () => {
    return process.env.MYSQL_USER ? process.env.MYSQL_USER : "mysql";
};

const generateMySQLPassword = () => {
    return process.env.MYSQL_PASSWORD
        ? process.env.MYSQL_PASSWORD
        : "password";
};

const generateMySQLDatabase = () => {
    return process.env.MYSQL_DATABASE ? process.env.MYSQL_DATABASE : "kino_rest";
};

const generateRedisHost = () => {
    return process.env.REDIS_HOST ? process.env.REDIS_HOST : "localhost";
};

const generateRedisPort = () => {
    return process.env.REDIS_PORT ? +process.env.REDIS_PORT : 6379;
};

export const dataConfig: DataSourceOptions = {
    type: "mysql",
    host: generateMySQLHost(),
    port: generateMySQLPort(),
    username: generateMySQLUsername(),
    password: generateMySQLPassword(),
    database: generateMySQLDatabase(),
    cache: {
        type: "redis",
        options: {
            socket: {
                host: generateRedisHost(),
                port: generateRedisPort(),
            },
        },
    },
    synchronize: true,
    logging: true,
    entities: [User, Book],
    subscribers: [UserSubscriber],
    migrations: [],
};