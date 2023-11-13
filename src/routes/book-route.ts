import { Router } from "express";

import { AuthenticationMiddleware } from "../middlewares/authentication-middleware";
import { UploadMiddleware } from "../middlewares/upload-middleware";
import { SOAPMiddleware } from "../middlewares/soap-middleware";
import { BookController } from "../controllers/book-controller";

export class BookRoute {
    authenticationMiddleware: AuthenticationMiddleware;
    uploadMiddleware: UploadMiddleware;
    soapMiddleware: SOAPMiddleware;
    bookController: BookController;

    constructor() {
        this.authenticationMiddleware = new AuthenticationMiddleware();
        this.uploadMiddleware = new UploadMiddleware();
        this.soapMiddleware = new SOAPMiddleware();
        this.bookController = new BookController();
    }

    getRoute() {
        return Router()
            .post(
                "/book",
                this.authenticationMiddleware.authenticate(),
                this.uploadMiddleware.upload({cover: "cover", audio: "audio"}),
                this.bookController.store()
            )
            .get(
                "/book",
                this.authenticationMiddleware.authenticate(),
                this.bookController.index()
            )
            .get(
                "/book/:id",
                this.authenticationMiddleware.authenticate(),
                this.bookController.show()
            )
            .put(
                "/book/:id",
                this.authenticationMiddleware.authenticate(),
                this.uploadMiddleware.upload({cover: "cover", audio: "audio"}),
                this.bookController.update()
            )
            .delete(
                "/book/:id",
                this.authenticationMiddleware.authenticate(),
                this.bookController.delete()
            )
            .get(
                "/app/book/:authorID", 
                this.bookController.indexAuthor())
            .get(
                "/app/book/listen/:bookID", 
                this.bookController.fetchBook())
            .post(
                "/series",
                this.authenticationMiddleware.authenticate(),
                this.uploadMiddleware.uploadCover(),
                this.bookController.storeSeries()
            )
            .get(
                "/series",
                this.authenticationMiddleware.authenticate(),
                this.bookController.indexSeries()
            )
            .get(
                "/analytics",
                this.authenticationMiddleware.authenticate(),
                this.bookController.analytics()
            )
    }
}