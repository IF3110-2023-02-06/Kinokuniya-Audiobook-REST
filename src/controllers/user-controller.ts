import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { bcryptConfig } from "../config/bcrypt-config";

import {
    AuthToken,
    AuthRequest,
} from "../middlewares/authentication-middleware";
import { jwtConfig } from "../config/jwt-config";
import { App } from "../app";

interface TokenRequest {
    username: string;
    password: string;
}

interface StoreRequest {
    email: string;
    username: string;
    name: string;
    password: string;
}

export class UserController {
    // Generates a JWT token for a user.
    token() {
        return async (req: Request, res: Response) => {
            const { username, password }: TokenRequest = req.body;
            if (!username || !password) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: ReasonPhrases.BAD_REQUEST,
                });
                return;
            }

            const user = await App.prisma.user.findUnique({
                where: {
                    username: username.toLowerCase(),
                },
                select: {
                    userID: true,
                    password: true,
                },
            });
            
            if (!user) {
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: "Invalid credentials",
                });
                return;
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: "Invalid credentials",
                });
                return;
            }

            const { userID } = user;
            const payload: AuthToken = {
                userID
            };
            const token = jwt.sign(payload, jwtConfig.secret, {
                expiresIn: jwtConfig.expiresIn,
            });

            res.status(StatusCodes.OK).json({
                message: ReasonPhrases.OK,
                token
            });
        };
    }

    // Handles the registration process.
    store() {
        return async (req: Request, res: Response) => {
            const { email, username, name, password }: StoreRequest = req.body;
            if (!email || !username || !name || !password) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: ReasonPhrases.BAD_REQUEST,
                });
                return;
            }

            const existingUserWithUsername = await App.prisma.user.findUnique({
                where: {
                    username: username.toLowerCase()
                }
            });
            if (existingUserWithUsername) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: "Username already taken!",
                });
                return;
            }

            const existingUserWithEmail = await App.prisma.user.findUnique({
                where: {
                    email: email
                }
            });
            if (existingUserWithEmail) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: "Email already taken!",
                });
                return;
            }

            const hashedPassword = await bcrypt.hash(password, bcryptConfig.saltRounds);

            const newUser = await App.prisma.user.create({
                data: {
                    email: email,
                    username: username.toLowerCase(),
                    name: name,
                    password: hashedPassword
                }
            });

            if (!newUser) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: ReasonPhrases.BAD_REQUEST,
                });
                return;
            }

            const { userID } = newUser;
            const payload: AuthToken = {
                userID
            };
            const token = jwt.sign(payload, jwtConfig.secret, {
                expiresIn: jwtConfig.expiresIn,
            });

            res.status(StatusCodes.CREATED).json({
                message: ReasonPhrases.CREATED,
                token,
            });
        };
    }

    // Update the details of a user.
    // Details conclude name, email, username, and password.
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

            const { name, email, username, password }: StoreRequest = req.body;
            if (!name || !email || !username || !password) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: ReasonPhrases.BAD_REQUEST,
                });
                return;
            }

            const user = await App.prisma.user.findUnique({
                where: {
                    userID: token.userID
                }
            });
            if (!user) {
                res.status(StatusCodes.NOT_FOUND).json({
                    message: ReasonPhrases.NOT_FOUND,
                });
                return;
            }

            const existingUserWithUsername = await App.prisma.user.findUnique({
                where: {
                    username: username.toLowerCase()
                }
            });
            if (existingUserWithUsername && existingUserWithUsername.userID !== token.userID) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: "Username already taken!",
                });
                return;
            }

            const existingUserWithEmail = await App.prisma.user.findUnique({
                where: {
                    email: email
                }
            });
            if (existingUserWithEmail && existingUserWithEmail.userID !== token.userID) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: "Email already taken!",
                });
                return;
            }

            const hashedPassword = await bcrypt.hash(password, bcryptConfig.saltRounds);

            const updatedUser = await App.prisma.user.update({
                where: {
                    userID: token.userID
                },
                data: {
                    email: email,
                    username: username.toLowerCase(),
                    name: name,
                    password: hashedPassword
                }
            });

            if (!updatedUser) {
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

    // Retrieves data of the authenticated user.
    index() {
        return async (req: Request, res: Response) => {

            console.log(req);

            const { token } = req as AuthRequest;
            if (!token) {
                // Endpoint can only be accessed by author
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            const user = await App.prisma.user.findUnique({
                where: {
                    userID: token.userID
                }
            });

            res.status(StatusCodes.OK).json({
                message: ReasonPhrases.OK,
                data: user
            });
        };
    }

    // Checks the authentication status of a user.
    check() {
        return async (req: Request, res: Response) => {
            const { token } = req as AuthRequest;
            if (!token) {
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            res.status(StatusCodes.OK).json({
                userID: token.userID
            });
        };
    }
}