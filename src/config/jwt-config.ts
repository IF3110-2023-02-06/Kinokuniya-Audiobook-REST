import { Secret } from "jsonwebtoken";

const generateSecret = () => {
    return process.env.JWT_SECRET_KEY
        ? process.env.JWT_SECRET_KEY
        : Math.random().toString();
};

const generateExpiresIn = () => {
    return process.env.JWT_EXPIRES_IN ? process.env.JWT_EXPIRES_IN : "1h";
};

export const jwtConfig: { secret: Secret; expiresIn: string } = {
    secret: generateSecret(),
    expiresIn: generateExpiresIn(),
};