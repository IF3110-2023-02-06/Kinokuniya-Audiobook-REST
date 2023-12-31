import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authentication-middleware";
import { Prisma, PrismaPromise } from '@prisma/client';
import * as fs from "fs";
import * as path from "path";

import { SOAPService } from "../services/soap-services";
import { App } from "../app";

interface IBookData {
    id: number;
    title: string;
    author: string;
    category: string;
    seriesID: number | null;
    bookDesc: string;
    price: number;
    publicationDate: Date;
    copiesSold: number;
    coverPath: string;
    audioPath: string;
}

interface ISeriesData {
    seriesID: number;
    seriesName: string;
}

export class BookController {
    // < REST API >
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
            const { title, category, seriesID, bookDesc, price, publicationDate } = req.body;

            const seriesIDInt = seriesID ? parseInt(seriesID) : null;
            const priceInt = parseInt(price);

            // Validate publication date to ISO 8601 format
            const date = new Date(publicationDate);
            if (date.toString() === 'Invalid Date') {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: ReasonPhrases.BAD_REQUEST,
                });
                return;
            }

            // Assert the type of req.files to let TypeScript know the structure
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            // Create new book by author
            const newBook = await App.prisma.book.create({
                data: {
                    title: title,
                    authorID: token.userID,
                    category: category,
                    seriesID: seriesIDInt, 
                    bookDesc: bookDesc,
                    price: priceInt,
                    publicationDate: date,
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

            // Get the title query
            const title = (req.query?.title || "" ) as string;

            // Get the series query
            let series = (req.query?.series || "") as string;
            series = series.toLowerCase();

            // Define the series filter
            const seriesFilter: Prisma.seriesWhereInput =
            series !== 'all series'
            ? {
                seriesName: {
                    mode: 'insensitive',
                    equals: series.toLowerCase(),
                },
            }
            : {
                seriesName: {
                    mode: 'insensitive',
                    contains: "",
                },
            };

            // Fetch all books by requester.
            const books = await App.prisma.book.findMany({
                where: {
                    authorID: token.userID,
                    title: {
                        mode: 'insensitive',
                        contains: title
                    },
                    series: seriesFilter // Include the series filter conditionally
                }
            });

            const length = await App.prisma.book.count({
                where: {
                    authorID: token.userID
                }
            });

            // Construct expected data
            const booksData: IBookData[] = [];

            for (const book of books) {
                
                // Get author name
                const author = await App.prisma.user.findUnique({
                    select: {
                        name: true
                    },
                    where: {
                        userID: book.authorID
                    }
                });

                booksData.push({
                    id: book.bookID,
                    title: book.title,
                    author: author!.name,
                    category: book.category,
                    seriesID: book.seriesID,
                    bookDesc: book.bookDesc,
                    price: book.price,
                    publicationDate: new Date(book.publicationDate),
                    copiesSold: book.copiesSold,
                    coverPath: book.coverPath,
                    audioPath: book.audioPath
                });
            }

            res.status(StatusCodes.OK).json({
                message: ReasonPhrases.OK,
                data: booksData
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
            const coverFile = fs.readFileSync(path.join(__dirname, '..', 'uploads', 'image', book.coverPath));
            const audioFile = fs.readFileSync(path.join(__dirname, '..', 'uploads', 'audio', book.audioPath));

            // Get author name
            const author = await App.prisma.user.findUnique({
                select: {
                    name: true
                },
                where: {
                    userID: book.authorID
                }
            });

            const bookData: IBookData = {
                id: book.bookID,
                title: book.title,
                author: author!.name,
                category: book.category,
                seriesID: book.seriesID,
                bookDesc: book.bookDesc,
                price: book.price,
                publicationDate: new Date(book.publicationDate),
                copiesSold: book.copiesSold,
                coverPath: book.coverPath,
                audioPath: book.audioPath
            };

            res.status(StatusCodes.OK).json({
                message: ReasonPhrases.OK,
                data: bookData,
            });
        };
    }

    // Update the details of a book.
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
            const { title, category, seriesID, bookDesc, price, publicationDate } = req.body;

            const seriesIDInt = seriesID ? parseInt(seriesID) : null;
            const priceInt = parseInt(price);

            // Validate publication date to ISO 8601 format 
            const date = new Date(publicationDate);
            if (date.toString() === 'Invalid Date') {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: ReasonPhrases.BAD_REQUEST,
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
                    authorID: token.userID,
                    category: category,
                    seriesID: seriesIDInt,
                    bookDesc: bookDesc,
                    price: priceInt,
                    publicationDate: date,
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
            fs.unlinkSync(path.join(__dirname, '..', 'uploads', 'image', oldCoverPath));
            fs.unlinkSync(path.join(__dirname, '..', 'uploads', 'audio', oldAudioPath));

            res.status(StatusCodes.OK).json({
                message: ReasonPhrases.OK,
            });
        };
    }

    // Delete a book.
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
                    message: ReasonPhrases.NOT_FOUND
                });
                return;
            }
            if (book.authorID != token.userID) {
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED
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
                    message: ReasonPhrases.BAD_REQUEST
                });
                return;
            }

            // Delete from storage
            fs.unlinkSync(
                path.join(
                    __dirname,
                    "..",
                    "uploads",
                    "image",
                    deletedBook.coverPath
                )
            );
            fs.unlinkSync(
                path.join(
                    __dirname,
                    "..",
                    "uploads",
                    "audio",
                    deletedBook.audioPath
                )
            );

            res.status(StatusCodes.OK).json({
                message: ReasonPhrases.OK,
            });
        };
    }

    // Creates a new series.
    storeSeries() {
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
            const { seriesName } = req.body;

            // Create new series by author
            const newSeries = await App.prisma.series.create({
                data: {
                    seriesName: seriesName
                }
            });

            if (!newSeries) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: ReasonPhrases.BAD_REQUEST,
                });
                return;
            }

            res.status(StatusCodes.CREATED).json({
                message: ReasonPhrases.CREATED,
                data: {
                    seriesID: newSeries.seriesID,
                    seriesName: newSeries.seriesName
                }
            });
        };
    }

    // Fetches all series where author's books are part of.
    indexSeries() {
        return async (req: Request, res: Response) => {
            const { token } = req as AuthRequest;
            if (!token) {
                // Endpoint can only be accessed by author
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            // Get the author ID
            const authorID = token.userID;

            // Fetch all series by author
            const series = await App.prisma.series.findMany({
                where: {
                    book: {
                        some: {
                            authorID: authorID
                        }
                    }
                }
            });

            // Get the query param for seriesName
            const seriesName = (req.query?.seriesName || "" ) as string;

            // Construct expected data
            const seriesData: ISeriesData[] = [];

            for (const s of series) {
                // If seriesName is not empty, filter by seriesName
                if (seriesName !== "" && s.seriesName.toLowerCase() !== seriesName.toLowerCase()) {
                    continue;
                }

                seriesData.push({
                    seriesID: s.seriesID,
                    seriesName: s.seriesName
                });
            }

            res.status(StatusCodes.OK).json({
                message: ReasonPhrases.OK,
                data: seriesData
            });
        }
    }

    // Fetches user analytics: total subs, total books, copies sold, total revenue.
    analytics() {
        return async (req: Request, res: Response) => {
            const { token } = req as AuthRequest;
            if (!token) {
                // Endpoint can only be accessed by author
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            // Get the author ID
            const authorID = token.userID;

            // Fetch all books by author
            const books = await App.prisma.book.findMany({
                where: {
                    authorID: authorID
                }
            });

            // TODO: Fetch all subscriptions by author
            
            // Count total revenue
            let bookRevenue = 0;
            let subRevenue = 0;
            for (const book of books) {
                bookRevenue += book.price;

                // TODO: Multiply by the number of copies sold
            }

            // TODO: Add the total revenue by subscription

            // Construct expected data
            const analyticsData = {
                booksCreated: books.length,
                totalSubs: 0,
                copiesSold: 0,
                bookRevenue: bookRevenue,
                subRevenue: subRevenue
            };

            res.status(StatusCodes.OK).json({
                message: ReasonPhrases.OK,
                data: analyticsData
            });
        }
    }

    // < SOAP API >
    // Fetches all books by author.
    indexAuthor() {
        return async (req: Request, res: Response) => {
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
                                
                // Get author name
                const author = await App.prisma.user.findUnique({
                    select: {
                        name: true
                    },
                    where: {
                        userID: book.authorID
                    }
                });

                booksData.push({
                    id: book.bookID,
                    title: book.title,
                    author: author!.name,
                    category: book.category,
                    seriesID: book.seriesID,
                    bookDesc: book.bookDesc,
                    price: book.price,
                    publicationDate: new Date(book.publicationDate),
                    copiesSold: book.copiesSold,
                    coverPath: book.coverPath,
                    audioPath: book.audioPath
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
            const coverFile = fs.readFileSync(path.join(__dirname, '..', 'uploads', 'image', book.coverPath));
            const audioFile = fs.readFileSync(path.join(__dirname, '..', 'uploads', 'audio', book.audioPath));

            // Get author name
            const author = await App.prisma.user.findUnique({
                select: {
                    name: true
                },
                where: {
                    userID: book.authorID
                }
            });

            const bookData: IBookData = {
                id: book.bookID,
                title: book.title,
                author: author!.name,
                category: book.category,
                seriesID: book.seriesID,
                bookDesc: book.bookDesc,
                price: book.price,
                publicationDate: new Date(book.publicationDate),
                copiesSold: book.copiesSold,
                coverPath: book.coverPath,
                audioPath: book.audioPath
            };

            res.status(StatusCodes.OK).json({
                message: ReasonPhrases.OK,
                data: bookData
            });
        };
    }

    // TODO: Method to buy a book (increment copies sold)
}