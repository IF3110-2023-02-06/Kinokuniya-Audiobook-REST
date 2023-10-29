import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";

import { SOAPService } from "../services/soap-services";

interface ValidateRequest {
    creatorID: number;
    subscriberID: number;
}

export class SOAPMiddleware {
    soapServices: SOAPService;

    constructor() {
        this.soapServices = new SOAPService();
    }

    validate() {
        return async (req: Request, res: Response, next: NextFunction) => {

            const { creatorID, subscriberID }: ValidateRequest = req.body;
            if (!creatorID || !subscriberID) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: ReasonPhrases.BAD_REQUEST,
                });
                return;
            }

            const isValidated = await this.soapServices.validate(
                creatorID,
                subscriberID
            );
            if (!isValidated) {
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            next();
        };
    }
}