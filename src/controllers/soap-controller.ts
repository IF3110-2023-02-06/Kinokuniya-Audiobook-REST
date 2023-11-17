import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { Request, Response } from "express";

import { AuthRequest } from "../middlewares/authentication-middleware";
import { soapConfig } from "../config/soap-config";
import axios from "axios";
import xml2js from "xml2js";

interface SubscriptionRequest {
    creatorID: number;
    subscriberID: number;
}

interface SubscriptionData {
    creatorID: number;
    subscriberID: number;
    creatorName: string;
    subscriberName: string;
}

export class SoapController {
    accept() {
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
            const { creatorID, subscriberID }: SubscriptionRequest = req.body;

            try {
                const response = await axios.post<string>(
                    `http://${soapConfig.host}:${soapConfig.port}/api/subscribe`,
                    `<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
                        <Body>
                            <approveSubscribe xmlns="http://services.kinokuniya/">
                                <arg0 xmlns="">${creatorID}</arg0>
                                <arg1 xmlns="">${subscriberID}</arg1>
                                <arg2 xmlns="">${soapConfig.key}</arg2>
                            </approveSubscribe>
                        </Body>
                    </Envelope>`,
                    {
                        headers: {
                            "Content-Type": "text/xml",
                        },
                    }
                );
                const xml = await xml2js.parseStringPromise(response.data);
                const result =
                    xml["S:Envelope"]["S:Body"][0][
                        "ns2:approveSubscribeResponse"
                    ][0].return[0];

                if (result === "Subscription not found") {
                    res.status(StatusCodes.NOT_FOUND).json({
                        message: result,
                    });
                    return;
                } else if (result === "Subscription accepted") {
                    res.status(StatusCodes.OK).json({
                        message: result,
                    });
                    return;
                } else {
                    res.status(StatusCodes.BAD_REQUEST).json({
                        message: result,
                    });
                    return;
                }
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    message: ReasonPhrases.INTERNAL_SERVER_ERROR,
                });
                return;
            }
        };
    }

    reject() {
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
            const { creatorID, subscriberID }: SubscriptionRequest = req.body;

            try {
                const response = await axios.post<string>(
                    `http://${soapConfig.host}:${soapConfig.port}/api/subscribe`,
                    `<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
                        <Body>
                            <rejectSubscribe xmlns="http://services.kinokuniya/">
                                <arg0 xmlns="">${creatorID}</arg0>
                                <arg1 xmlns="">${subscriberID}</arg1>
                                <arg2 xmlns="">${soapConfig.key}</arg2>
                            </rejectSubscribe>
                        </Body>
                    </Envelope>`,
                    {
                        headers: {
                            "Content-Type": "text/xml",
                        },
                    }
                );
                const xml = await xml2js.parseStringPromise(response.data);
                const result =
                    xml["S:Envelope"]["S:Body"][0][
                        "ns2:rejectSubscribeResponse"
                    ][0].return[0];

                if (result === "Subscription not found") {
                    res.status(StatusCodes.NOT_FOUND).json({
                        message: result,
                    });
                    return;
                } else if (result === "Subscription rejected") {
                    res.status(StatusCodes.OK).json({
                        message: result,
                    });
                    return;
                } else {
                    res.status(StatusCodes.BAD_REQUEST).json({
                        message: result,
                    });
                    return;
                }
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    message: ReasonPhrases.INTERNAL_SERVER_ERROR,
                });
                return;
            }
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

            
            let subscriptionData: SubscriptionData[] = [];
            try {
                console.log("Index is called");
                const response = await axios.post<string>(
                    `http://${soapConfig.host}:${soapConfig.port}/api/subscribe`,
                    `<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
                        <Body>
                            <getAllReqSubscribe xmlns="http://services.kinokuniya/">
                                <arg1 xmlns="">${token.userID}</arg1>
                                <arg2 xmlns="">${soapConfig.key}</arg2>
                            </getAllReqSubscribe>
                        </Body>
                    </Envelope>`,
                    {
                        headers: {
                            "Content-Type": "text/xml",
                        },
                    }
                );

                const xml = await xml2js.parseStringPromise(response.data);
                
                const results =
                xml["S:Envelope"]["S:Body"][0][
                    "ns2:getAllReqSubscribeResponse"
                ][0].return[0].data;
                
                if (!results) {
                    res.status(StatusCodes.OK).json({
                        message: ReasonPhrases.OK,
                        data: []
                    });
                    return;
                }

                results.forEach((result: any) => {
                    subscriptionData.push({
                        creatorID: result.creatorID[0],
                        subscriberID: result.subscriberID[0],
                        creatorName: result.creatorName[0],
                        subscriberName: result.subscriberName[0],
                    });
                });

                res.status(StatusCodes.OK).json({
                    message: ReasonPhrases.OK,
                    data: subscriptionData
                });
                return;
            } catch (error) {
                console.log(error);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    message: ReasonPhrases.INTERNAL_SERVER_ERROR,
                });
                return;
            }
        };
    }

    subscribers() {
        return async (req: Request, res: Response) => {
            const { token } = req as AuthRequest;
            if (!token) {
                // Endpoint can only be accessed by author
                res.status(StatusCodes.UNAUTHORIZED).json({
                    message: ReasonPhrases.UNAUTHORIZED,
                });
                return;
            }

            let subscriptionData: SubscriptionData[] = [];
            try {
                const response = await axios.post<string>(
                    `http://${soapConfig.host}:${soapConfig.port}/api/subscribe`,
                    `<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
                        <Body>
                            <getAllSubscribers xmlns="http://services.kinokuniya/">
                                <arg1 xmlns="">${token.userID}</arg1>
                                <arg2 xmlns="">${soapConfig.key}</arg2>
                            </getAllSubscribers>
                        </Body>
                    </Envelope>`,
                    {
                        headers: {
                            "Content-Type": "text/xml",
                        },
                    }
                );
                const xml = await xml2js.parseStringPromise(response.data);

                const results =
                    xml["S:Envelope"]["S:Body"][0][
                        "ns2:getAllSubscriberResponse"
                    ][0].return[0];

                if (!results) {
                    res.status(StatusCodes.OK).json({
                        message: ReasonPhrases.OK,
                        data: []
                    });
                    return;
                }

                results.forEach((result: any) => {
                    subscriptionData.push({
                        creatorID: result.creatorID[0],
                        subscriberID: result.subscriberID[0],
                        creatorName: result.creatorName[0],
                        subscriberName: result.subscriberName[0],
                    });
                });

                res.status(StatusCodes.OK).json({
                    message: ReasonPhrases.OK,
                    data: subscriptionData
                });
                return;
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    message: ReasonPhrases.INTERNAL_SERVER_ERROR,
                });
                return;
            }
        };
    }
}