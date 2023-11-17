const generateHost = () => {
    return process.env.SOAP_BASE_HOST ? process.env.SOAP_BASE_HOST : "localhost";
};

const generatePort = () => {
    return process.env.SOAP_BASE_PORT ? +process.env.SOAP_BASE_PORT : 8001;
};

export const soapConfig: {host : string, port: number, key: string } = {
    host: generateHost(),
    port: generatePort(),
    key: process.env.SOAP_KEY ?? "bebf9c5b-d020-429b-a2df-fc3fa5e61129"
};