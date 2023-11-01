import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authentication-middleware";

import * as fs from "fs";
import * as path from "path";

import { SOAPService } from "../services/soap-services";
import { App } from "../app";

interface UpdateRequest {
    title: string;
}

interface IBookData {
    id: number;
    title: string;
}

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
            const newBook = away App.prisma.book.create({
                data: {
                    title: title,
                    authorID: token.userID,
                    audioPath: req.file!.filename
                }
            });

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
            
            const books = await App.prisma.book.findMany({
                select: {
                    bookID: true,
                    title: true
                },
                where: {
                    authorID: token.userID
                },
                skip: (page - 1) * pageSize,
                take: pageSize
            });

            const length = await App.prisma.book.count({
                select: {
                    bookID: true
                },
                where: {
                    authorID: token.userID
                }
            });

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
            const book = await App.prisma.book.findUnique({
                where: {
                    bookID: bookID
                }
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

            const book = await App.prisma.book.findUnique({
                where: {
                    bookID: bookID
                }
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
            const newBook = await App.prisma.book.update({
                where: {
                    bookID: bookID
                },
                data: {
                    title: title,
                    audioPath: req.file!.filename
                }
            });

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

            const book = await App.prisma.book.findUnique({
                where: {
                    bookID: bookID
                }
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
            const newBook = await App.prisma.book.update({
                where: {
                    bookID: bookID
                },
                data: {
                    title: title
                }
            });

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

            // const book = await Book.findOneBy({
            //     bookID,
            // });

            const book = await App.prisma.book.findUnique({
                where: {
                    bookID: bookID
                }
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
            // const deletedBook = await book.remove();

            const deletedBook = await App.prisma.book.delete({
                where: {
                    bookID: bookID
                }
            });
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
            // const books = await Book.findBy({
            //     authorID: parseInt(authorID),
            // });

            const books = await App.prisma.book.findMany({
                where: {
                    authorID: creatorID
                }
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
            // const book = await Book.findOneBy({
            //     bookID
            // });

            const book = await App.prisma.book.findUnique({
                where: {
                    bookID: bookID
                }
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