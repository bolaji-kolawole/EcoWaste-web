
import { type Encryptor, LzEncryptor } from "./Encryptor";

export const CacheManager = {

    __cacheImpl__: localStorage,
    __encryptorImpl__: LzEncryptor,
    PROFILE_KEY: "ecowaste.p",
    ACCESS_TOKEN_KEY: "ecowaste.at",
    SESSION_TOKEN_KEY: "ecowaste.st",

    setStorage(cacheImpl: Storage) {
        CacheManager.__cacheImpl__ = cacheImpl;
    },

    setEncryptor(encryptorImpl: Encryptor) {
        CacheManager.__encryptorImpl__ = encryptorImpl;
    },

    has(key: string) {
        const item = CacheManager.__cacheImpl__.getItem(key);
        return (item !== null && item !== "")
    },

    remove(key: string) {
        CacheManager.__cacheImpl__.removeItem(key);
    },

    insecurePut(key: string, value: string | number | Object) {
        const valueToStore = JSON.stringify({
            value,
            type: typeof value,
        });
        CacheManager.__cacheImpl__.setItem(key, CacheManager.__encryptorImpl__ ? CacheManager.__encryptorImpl__.encrypt(valueToStore) : valueToStore);
    },

    put(key: string, value: string | number | Object) {
        if (!CacheManager.has(CacheManager.ACCESS_TOKEN_KEY)) return;
        CacheManager.insecurePut(key, value);
    },

    get(key: string, fallback?: any) {
        if (!CacheManager.has(key)) {
            if (key === CacheManager.PROFILE_KEY) {
                window.location = "/" as any;
            }
            return fallback;
        }
        const cacheValue = CacheManager.__cacheImpl__.getItem(key) as string;
        const valueToStore = JSON.parse(CacheManager.__encryptorImpl__ ? CacheManager.__encryptorImpl__.decrypt(cacheValue) : cacheValue);
        return valueToStore.value;
    },

    clear() {
        CacheManager.__cacheImpl__.clear();
    }

}
