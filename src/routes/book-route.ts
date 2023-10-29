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
                this.uploadMiddleware.upload("file"),
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
                "/book/title/:id",
                this.authenticationMiddleware.authenticate(),
                this.bookController.updateTitle()
            )
            .put(
                "/book/:id",
                this.authenticationMiddleware.authenticate(),
                this.uploadMiddleware.upload("file"),
                this.bookController.update()
            )
            .delete(
                "/book/:id",
                this.authenticationMiddleware.authenticate(),
                this.bookController.delete()
            )
            .get(
                "/app/book/:author_id", 
                this.bookController.indexArtist())
            .get(
                "/app/book/listen/:book_id", 
                this.bookController.fetchBook());
    }
}