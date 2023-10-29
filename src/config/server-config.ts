const generatePort = () => {
    return process.env.PORT ? +process.env.PORT : 3000;
};

export const serverConfig: { port: number } = {
    port: generatePort(),
};