import bcrypt from "bcrypt";

const generateSaltRounds = () => {
    return process.env.SALT_ROUNDS ? +process.env.SALT_ROUNDS : 10;
};

export const bcryptConfig: { saltRounds: number } = {
    saltRounds: generateSaltRounds(),
};