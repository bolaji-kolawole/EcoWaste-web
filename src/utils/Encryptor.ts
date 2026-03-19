
import lzString from "lz-string";

export type Encryptor = {
    encrypt: (value: any, toBase64?: boolean) => any;
    decrypt: (value: any, fromBase64?: boolean) => any;
};

export const LzEncryptor: Encryptor = {

    encrypt(value: any, toBase64: boolean = false) {
        return (toBase64 ? lzString.compressToBase64(value) : lzString.compress(value));
    },

    decrypt(value: any, fromBase64: boolean = false) {
        return (fromBase64 ? lzString.decompressFromBase64(value) : lzString.decompress(value));
    }

}
