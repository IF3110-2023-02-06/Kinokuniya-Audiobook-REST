const generateCacheExpirationTime = () => {
    return process.env.CACHE_EXPIRATION_TIME
        ? +process.env.CACHE_EXPIRATION_TIME
        : 60000;
};

export const cacheConfig: { cacheExpirationTime: number } = {
    cacheExpirationTime: generateCacheExpirationTime(),
};