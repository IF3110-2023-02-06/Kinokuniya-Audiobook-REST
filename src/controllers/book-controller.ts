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
    category: string;
    bookDesc: string;
    price: number;
    publicationDate: Date;
    coverFile: Buffer;
    audioFile: Buffer;
}

export class BookController {
    // Creates a new book.
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
            const { title, category, bookDesc, price, publicationDate } = req.body;

            // Assert the type of req.files to let TypeScript know the structure
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            // Create new book by author
            const newBook = await App.prisma.book.create({
                data: {
                    title: title,
                    authorID: token.userID,
                    category: category,
                    bookDesc: bookDesc,
                    price: price,
                    publicationDate: publicationDate,
                    coverPath: files['cover'][0].filename,
                    audioPath: files['audio'][0].filename
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

    // Fetches all books by requester.
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
                where: {
                    authorID: token.userID
                },
                skip: (page - 1) * pageSize,
                take: pageSize
            });

            const length = await App.prisma.book.count({
                where: {
                    authorID: token.userID
                }
            });

            let totalPage = Math.ceil(length / pageSize);
            if (totalPage === 0) {
                totalPage = 1;
            }

            // Construct expected data
            const booksData: IBookData[] = [];

            for (const book of books) {
                const coverFile = fs.readFileSync(path.join(__dirname, '..', '..', 'uploads', book.coverPath));
                const audioFile = fs.readFileSync(path.join(__dirname, '..', '..', 'uploads', book.audioPath));

                booksData.push({
                    id: book.bookID,
                    title: book.title,
                    category: book.category,
                    bookDesc: book.bookDesc,
                    price: book.price,
                    publicationDate: book.publicationDate,
                    coverFile: coverFile,
                    audioFile: audioFile
                });
            }

            res.status(StatusCodes.OK).json({
                message: ReasonPhrases.OK,
                data: booksData,
                totalPage: totalPage
            });
        };
    }

    // Fetches a book by requester.
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

            // Fetch book by requester
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
            if (book.authorID !== token.userID) {
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            // Construct expected data
            const coverFile = fs.readFileSync(path.join(__dirname, '..', '..', 'uploads', book.coverPath));
            const audioFile = fs.readFileSync(path.join(__dirname, '..', '..', 'uploads', book.audioPath));

            const bookData: IBookData = {
                id: book.bookID,
                title: book.title,
                category: book.category,
                bookDesc: book.bookDesc,
                price: book.price,
                publicationDate: book.publicationDate,
                coverFile: coverFile,
                audioFile: audioFile
            };

            res.status(StatusCodes.OK).json({
                message: ReasonPhrases.OK,
                data: bookData,
            });
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
            const { title, category, bookDesc, price, publicationDate } = req.body;

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
            if (book.authorID !== token.userID) {
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            // Get old filename
            const oldAudioPath = book.audioPath;
            const oldCoverPath = book.coverPath;

            // Assert the type of req.files to let TypeScript know the structure
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            // Save the new book
            const updatedBook = await App.prisma.book.update({
                where: {
                    bookID: bookID,
                },
                data: {
                    title: title,
                    category: category,
                    bookDesc: bookDesc,
                    price: price,
                    publicationDate: publicationDate,
                    audioPath: files['audio'][0].filename,
                    coverPath: files['cover'][0].filename,
                },
            });

            if (!updatedBook) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: ReasonPhrases.BAD_REQUEST,
                });
                return;
            }

            // Delete old file from storage
            fs.unlinkSync(path.join(__dirname, '..', '..', 'uploads', oldAudioPath));
            fs.unlinkSync(path.join(__dirname, '..', '..', 'uploads', oldCoverPath));

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
            fs.unlinkSync(
                path.join(
                    __dirname,
                    "..",
                    "..",
                    "uploads",
                    deletedBook.coverPath
                )
            );

            res.status(StatusCodes.OK).json({
                message: ReasonPhrases.OK,
            });
        };
    }

    // Fetches all books by author.
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
            const books = await App.prisma.book.findMany({
                where: {
                    authorID: creatorID
                }
            });

            // Construct expected data
            const booksData: IBookData[] = [];

            for (const book of books) {
                const coverFile = fs.readFileSync(path.join(__dirname, '..', '..', 'uploads', book.coverPath));
                const audioFile = fs.readFileSync(path.join(__dirname, '..', '..', 'uploads', book.audioPath));

                booksData.push({
                    id: book.bookID,
                    title: book.title,
                    category: book.category,
                    bookDesc: book.bookDesc,
                    price: book.price,
                    publicationDate: book.publicationDate,
                    coverFile: coverFile,
                    audioFile: audioFile
                });
            }

            res.status(StatusCodes.OK).json({
                message: ReasonPhrases.OK,
                data: booksData,
            });
        };
    }

    // Fetches a book by book ID.
    fetchBook() {
        return async (req: Request, res: Response) => {
            
            const bookID = parseInt(req.params.bookID);
            const subscriberID = parseInt(req.query.subscriber_id as string);
            
            // Fetch all books by requester
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
                    message: ReasonPhrases.UNAUTHORIZED
                });
                return;
            }

            // If book is not found
            if (!book) {
                res.status(StatusCodes.NOT_FOUND).json({
                    message: ReasonPhrases.NOT_FOUND
                });
                return;
            }

            // Construct expected data
            const coverFile = fs.readFileSync(path.join(__dirname, '..', '..', 'uploads', book.coverPath));
            const audioFile = fs.readFileSync(path.join(__dirname, '..', '..', 'uploads', book.audioPath));

            const bookData: IBookData = {
                id: book.bookID,
                title: book.title,
                category: book.category,
                bookDesc: book.bookDesc,
                price: book.price,
                publicationDate: book.publicationDate,
                coverFile: coverFile,
                audioFile: audioFile
            };

            res.status(StatusCodes.OK).json({
                message: ReasonPhrases.OK,
                data: bookData
            });
        };
    }
}