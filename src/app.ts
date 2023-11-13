import express, { Express } from "express";
import cors from 'cors';
import { PrismaClient } from "@prisma/client";
import morgan from "morgan";
import "reflect-metadata";

import { serverConfig } from "./config/server-config";
import { UserRoute } from "./routes/user-route";
import { BookRoute } from "./routes/book-route";
import { SoapRoute } from "./routes/soap-route";

export class App {
    prisma: PrismaClient;
    server: Express;

    static prisma = new PrismaClient();

    constructor() {
        const userRoute = new UserRoute();
        const bookRoute = new BookRoute();
        const soapRoute = new SoapRoute();

        this.server = express();
        this.server.use((cors as (options: cors.CorsOptions) => express.RequestHandler)({}));
        this.server.use(
            "/api",
            express.json({ limit: "50mb" }),
            express.urlencoded({ extended: true }),
            express.static('src/uploads'),
            morgan("combined"),
            userRoute.getRoute(),
            bookRoute.getRoute(),
            soapRoute.getRoute()
        );
    }

    async run() {
        try {
            this.server.listen(serverConfig.port, () => {
                console.log(`Server is running on port: ${serverConfig.port}`);
            });
        } catch (error) {
            console.error(error);
        }
    }
}