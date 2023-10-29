import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authentication-middleware";

import { Book } from "../models/book-model";

import * as fs from "fs";
import * as path from "path";

import { SOAPService } from "../services/soap-services";

interface UpdateRequest {
    title: string;
}

interface IBookData {
    id: number;
    title: string;
}

// interface IPageData {
//     page: number;
//     totalPage: number;
// }

export class BookController {
    store() {
        return async (req: Request, res: Response) => {
            const { token } = req as AuthRequest;
            if (!token) {
                // Endpoint can only be accessed by author
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            // Parse request body
            const { title } = req.body;

            // Create new book by author
            const book = new Book();
            book.title = title;
            book.authorID = token.userID;
            book.audioPath = req.file!.filename;

            // Buat lagu
            const newBook = await book.save();
            if (!newBook) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: ReasonPhrases.BAD_REQUEST,
                });
                return;
            }

            res.status(StatusCodes.CREATED).json({
                message: ReasonPhrases.CREATED,
            });
        };
    }

    index() {
        return async (req: Request, res: Response) => {
            const { token } = req as AuthRequest;
            if (!token) {
                // Endpoint can only be accessed by author
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            // Get page query
            const page = parseInt((req.query?.page || "1") as string);
            const pageSize = parseInt((req.query?.pageSize || "5") as string);

            const [books, length] = await Promise.all([
                Book.createQueryBuilder("book")
                    .select(["book.bookID", "book.title"])
                    .where("book.authorID = :userID", {
                        userID: token.userID,
                    })
                    .skip((page - 1) * pageSize)
                    .take(pageSize)
                    .getMany(),
                Book.createQueryBuilder("book")
                    .select(["book.bookID"])
                    .where("book.authorID = :userID", {
                        userID: token.userID,
                    })
                    .getCount(),
            ]);

            let totalPage = Math.ceil(length / pageSize);
            if (totalPage === 0) {
                totalPage = 1;
            }

            res.status(StatusCodes.OK).json({
                message: ReasonPhrases.OK,
                data: books,
                totalPage: totalPage,
            });
        };
    }

    show() {
        return async (req: Request, res: Response) => {
            const { token } = req as AuthRequest;
            if (!token) {
                // Endpoint can only be accessed by author
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            const bookID = parseInt(req.params.id);

            // Fetch books
            const book = await Book.findOneBy({
                bookID,
            });

            // If book is not found
            if (!book) {
                res.status(StatusCodes.NOT_FOUND).json({
                    message: ReasonPhrases.NOT_FOUND,
                });
                return;
            }

            // Not the requester's book
            if (book.authorID != token.userID) {
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            res.sendFile(
                path.join(__dirname, "..", "..", "uploads", book.audioPath)
            );
        };
    }

    update() {
        return async (req: Request, res: Response) => {
            const { token } = req as AuthRequest;
            if (!token) {
                // Endpoint can only be accessed by author
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            // Parse request body
            const { title }: UpdateRequest = req.body;

            // Parse request param
            const bookID = parseInt(req.params.id);

            const book = await Book.findOneBy({
                bookID,
            });

            // If book is not found
            if (!book) {
                res.status(StatusCodes.NOT_FOUND).json({
                    message: ReasonPhrases.NOT_FOUND,
                });
                return;
            }

            // Not the requester's book
            if (book.authorID != token.userID) {
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            // Get old filename
            const oldFilename = book.audioPath;

            // Update model
            book.title = title;
            book.audioPath = req.file!.filename;

            // Save the new book
            const newBook = await book.save();
            if (!newBook) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: ReasonPhrases.BAD_REQUEST,
                });
                return;
            }

            // Delete old file from storage
            fs.unlinkSync(
                path.join(__dirname, "..", "..", "uploads", oldFilename)
            );

            res.status(StatusCodes.OK).json({
                message: ReasonPhrases.OK,
            });
        };
    }

    updateTitle() {
        return async (req: Request, res: Response) => {
            const { token } = req as AuthRequest;
            if (!token) {
                // Endpoint can only be accessed by author
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            // Parse request body
            const { title }: UpdateRequest = req.body;

            // Parse request param
            const bookID = parseInt(req.params.id);

            const book = await Book.findOneBy({
                bookID
            });

            // If book is not found
            if (!book) {
                res.status(StatusCodes.NOT_FOUND).json({
                    message: ReasonPhrases.NOT_FOUND,
                });
                return;
            }

            // Not the requester's book
            if (book.authorID != token.userID) {
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            // Update model
            book.title = title;

            // Save the new book
            const newBook = await book.save();
            if (!newBook) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: ReasonPhrases.BAD_REQUEST,
                });
                return;
            }

            res.status(StatusCodes.OK).json({
                message: ReasonPhrases.OK,
            });
        };
    }

    delete() {
        return async (req: Request, res: Response) => {
            const { token } = req as AuthRequest;
            if (!token) {
                // Endpoint can only be accessed by author
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            // Parse request param
            const bookID = parseInt(req.params.id);

            const book = await Book.findOneBy({
                bookID,
            });

            // If book is not found
            if (!book) {
                res.status(StatusCodes.NOT_FOUND).json({
                    message: ReasonPhrases.NOT_FOUND,
                });
                return;
            }
            if (book.authorID != token.userID) {
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            // Delete from database
            const deletedBook = await book.remove();
            if (!deletedBook) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: ReasonPhrases.BAD_REQUEST,
                });
                return;
            }

            // Delete from storage
            fs.unlinkSync(
                path.join(
                    __dirname,
                    "..",
                    "..",
                    "uploads",
                    deletedBook.audioPath
                )
            );

            res.status(StatusCodes.OK).json({
                message: ReasonPhrases.OK,
            });
        };
    }

    indexAuthor() {
        return async (req: Request, res: Response) => {
            // Get page query
            const { authorID } = req.params;
            const creatorID = parseInt(authorID);
            const subscriberID = parseInt(req.query.subscriber_id as string);
            
            // Authenticate subscription
            const svc = new SOAPService();
            const isValid = await svc.validate(creatorID, subscriberID);

            if (!isValid) {
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            // Fetch all books by requester
            const books = await Book.findBy({
                authorID: parseInt(authorID),
            });

            // Construct expected data
            const booksData: IBookData[] = [];

            books.forEach((book: Book) => {
                booksData.push({
                    id: book.bookID,
                    title: book.title
                });
            });

            res.status(StatusCodes.OK).json({
                message: ReasonPhrases.OK,
                data: booksData,
            });
        };
    }

    fetchBook() {
        return async (req: Request, res: Response) => {
            
            const bookID = parseInt(req.params.bookID);
            const subscriberID = parseInt(req.query.subscriber_id as string);
            
            // Fetch all books by requester
            const book = await Book.findOneBy({
                bookID
            });
            
            // Authenticate subscription
            const svc = new SOAPService();
            const isValid = await svc.validate(book!.authorID, subscriberID);

            if (!isValid) {
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            // If book is not found
            if (!book) {
                res.status(StatusCodes.NOT_FOUND).json({
                    message: ReasonPhrases.NOT_FOUND,
                });
                return;
            }

            res.sendFile(
                path.join(__dirname, "..", "..", "uploads", book.audioPath)
            );
        };
    }
}