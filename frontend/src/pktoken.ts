import { AUTH_CONFIG } from "./authConfig";
import { generateRandomBytes, toHexString } from "./authHelper";
import { SHA3 } from "sha3";
import axios from "axios";
import * as jwkpem from "jwk-to-pem";
import { Buffer } from "buffer";

interface JWK {
    alg?: string | undefined;
    kty?: string | undefined;
    use?: string | undefined;
    n?: string | undefined;
    e?: string | undefined;
    crv?: string | undefined;
    d?: string | undefined;
    ext?: boolean | undefined;
    key_ops?: Array<string> | undefined;
    x?: string | undefined;
    y?: string | undefined;
}
interface cicJSON {
    upk: string;
    alg: string;
    rz: string;
}
interface osmHeaderJSON {
    alg: string;
    kid: string;
    typ: string;
}
interface jwkResponse {
    keys: jwkpem.JWK;
}
const ecdsaGenParams = {
    name: "ECDSA",
    namedCurve: "P-384"
};

const ecdsaParams = {
    name: "ECDSA",
    hash: { name: "SHA-384" }
};
const openIDAlg = "RSASSA-PKCS1-v1_5";
const openIDAlgImport = { name: openIDAlg, hash: "SHA-256" };

export class opkService {
    /**
     *
     * @param toHash Buffer object
     * @returns SHA-3 hash of input
     */
    private static hashHelper(toHash: Buffer): Buffer {
        // Helper function to hash a string for us
        const hashClient = new SHA3(256);
        hashClient.update(toHash);
        return hashClient.digest();
    }
    /**
     *
     * @param base64 base64 input as string
     * @returns JSON object interpretation of input
     */
    private static b64ToJSON<T>(base64: string): T {
        const json = Buffer.from(base64, "base64").toString("utf8");
        return JSON.parse(json);
    }

    /**
     *
     * @param json json input
     * @returns string of b64 interpretation of input stringified
     */
    private static JSONtob64(json: JSON): string {
        const jsonString = JSON.stringify(json);
        return Buffer.from(jsonString, "utf8").toString("base64");
    }

    /**
     *
     * @param key CryptoKey input
     * @returns exported key as base64 string representation of JWK
     */
    private static async exportKey(key: CryptoKey): Promise<string> {
        const keyAsJwk: JWK = await window.crypto.subtle.exportKey("jwk", key);
        return this.JSONtob64(keyAsJwk as JSON);
    }

    /**
     *
     * @param b64 b64 string representation of JWK
     * @param signing true if key is for signing, false if for verifying
     * @returns CryptoKey representation of key input
     */
    private static async importKey(b64: string, signing: boolean): Promise<CryptoKey> {
        const key = this.b64ToJSON(b64) as JWK;
        let keyAsCrypto: CryptoKey;
        if (signing) {
            keyAsCrypto = await window.crypto.subtle.importKey("jwk", key, ecdsaGenParams, true, [
                "sign"
            ]);
        } else {
            keyAsCrypto = await window.crypto.subtle.importKey("jwk", key, ecdsaGenParams, true, [
                "verify"
            ]);
        }
        return keyAsCrypto;
    }

    private static async arrayBufferTob64(buf: ArrayBuffer) {
        const ret = Buffer.from(buf).toString("base64");
        return ret;
    }

    private static async b64ToArrayBuffer(b64: string) {
        const ret = Buffer.from(b64, "base64");
        return ret;
    }
    /**
     *
     * @param header header as b64 string
     * @param payload payload as b64 string
     * @returns Buffer object ready for signature
     */
    private static generateSigData(header: string, payload: string): Buffer {
        return Buffer.from(header + "." + payload, "utf-8");
    }

    /**
     * Generates new keys and saves to localStorage
     */
    private static async generateKeys(): Promise<void> {
        const keypair = await window.crypto.subtle.generateKey(ecdsaGenParams, true, [
            "sign",
            "verify"
        ]);
        const pkString = await this.exportKey(keypair.publicKey);
        const skString = await this.exportKey(keypair.privateKey);

        localStorage.setItem("opk_public_key", pkString);
        localStorage.setItem("opk_private_key", skString);

        console.log("keys generated");
    }

    /**
     * Generates new nonce, and generates keys if keys don't already exist
     * @returns Promise of nonce
     */
    public static async generateNonce(): Promise<string> {
        if (localStorage.getItem("opk_public_key") === null) {
            console.log("no keys found, generating keys now");
            await this.generateKeys();
        }
        const pkString = localStorage.getItem("opk_public_key") || "";
        const alg = "ECDSA";
        const rz = toHexString(generateRandomBytes(AUTH_CONFIG.state_length));

        const cic = { upk: pkString, alg: alg, rz: rz };
        const cicString = JSON.stringify(cic);
        const nonce = this.hashHelper(Buffer.from(cicString, "utf8")).toString("base64");

        localStorage.setItem("opk_cic", cicString);

        return nonce;
    }

    /**
     * Generates a pkToken from a given idToken
     * @param idToken idToken returned by OP, as a b64 string/JWT
     * @returns string pkToken represented by a "double" JWT;  userHeader + "." + opHeader + "." + payload + "." + opSig + "." + userSig;
     */
    public static async generatePKToken(idToken: string): Promise<string> {
        //make protected header from cic
        //sign w private key
        //add signature,header to id token
        const privateKey: CryptoKey = await this.importKey(
            localStorage.getItem("opk_private_key") || "",
            true
        );
        const cic: JSON = JSON.parse(localStorage.getItem("opk_cic") || "");
        const [opHeader, payload, opSig] = idToken.split(".");

        const userHeader = this.JSONtob64(cic);
        const userSigBuf = await window.crypto.subtle.sign(
            ecdsaParams,
            privateKey,
            this.generateSigData(userHeader, payload)
        );
        const userSig = await this.arrayBufferTob64(userSigBuf);

        const pkToken = userHeader + "." + opHeader + "." + payload + "." + opSig + "." + userSig;

        localStorage.setItem("opk_pktoken", pkToken);
        return pkToken;
    }

    /**
     * Checks if a pkToken is valid. Throws error if invalid
     * @param pkToken pkToken as a JWS of the form userHeader.opHeader.payload.opSig.userSig
     * @returns true if pkToken is verified, false if fails verification
     */
    public static async verifyPKToken(pkToken: string): Promise<boolean> {
        //check client id, aud, iss
        //extract kid from OP header
        //uses kid to get PKo and verify OP signature
        //check nonce = sha3(cic from pkt header)
        //use cic stuff to verify pk signature
        const [userHeader, opHeader, payload, opSig, userSig] = pkToken.split(".");

        const payloadJSON = this.b64ToJSON<{
            aud: string;
            iss: string;
            nonce: string;
            kid: string;
        }>(payload);
        const cicJSON = this.b64ToJSON<cicJSON>(userHeader);
        const cicString = JSON.stringify(cicJSON);

        //check client id, aud, iss
        if (!payloadJSON.aud.includes(AUTH_CONFIG.client_id)) return false;
        if (!(payloadJSON.iss === "https://oidc.mit.edu/")) return false;

        //verify OP signature
        //Fetch the OIDC server public key
        const oidcPublicKeys = (await axios.get<jwkResponse>(AUTH_CONFIG.public_key)).data;
        if ("keys" in oidcPublicKeys && Array.isArray(oidcPublicKeys.keys)) {
            const firstKey = oidcPublicKeys.keys[0];
            const opKey = await window.crypto.subtle.importKey(
                "jwk",
                firstKey,
                openIDAlgImport,
                true,
                ["verify"]
            );
            const verIdToken = await window.crypto.subtle.verify(
                openIDAlg,
                opKey,
                await this.b64ToArrayBuffer(opSig),
                this.generateSigData(opHeader, payload)
            );
            if (!verIdToken) return false;
        } else {
            return false;
        }

        //check nonce = sha3(cic)
        const nonce = payloadJSON.nonce;
        if (!(this.hashHelper(Buffer.from(cicString, "utf8")).toString("base64") === nonce))
            return false;

        //check cic is well formed (has alg,rz,upk)
        if (cicJSON.alg === undefined) return false;
        if (cicJSON.rz === undefined) return false;
        if (cicJSON.upk === undefined) return false;

        //verify pk signature
        const userPubKey = await this.importKey(cicJSON.upk, false);
        const ver = await window.crypto.subtle.verify(
            ecdsaParams,
            userPubKey,
            await this.b64ToArrayBuffer(userSig),
            this.generateSigData(userHeader, payload)
        );
        console.log("verified pktoken", ver);
        if (!ver) return false;
        return true;
    }

    /**
     *
     * @returns pkToken of user
     */
    public static getPKToken(): string {
        const pkToken = localStorage.getItem("opk_pktoken") || "";
        return pkToken;
    }

    /**
     *
     * @param message message to sign
     * @returns OSM of message
     */
    public static async generateOSM(message: string): Promise<string> {
        console.log("Generating OSM");
        const cic = JSON.parse(localStorage.getItem("opk_cic") || "");
        const pkToken = localStorage.getItem("opk_pktoken") || "";
        const privateKey = await this.importKey(
            localStorage.getItem("opk_private_key") || "",
            true
        );
        const header: any = {
            alg: cic.alg,
            kid: this.hashHelper(Buffer.from(pkToken, "utf8")).toString("base64"),
            typ: "osm"
        };
        const headerJSON = header as JSON;
        const payloadB64 = Buffer.from(message).toString("base64");
        const headerB64 = this.JSONtob64(headerJSON);

        const sigData = this.generateSigData(headerB64, payloadB64);
        const sig = await window.crypto.subtle.sign(ecdsaParams, privateKey, sigData);
        console.log("SIGNATURE", sig);
        const osm = headerB64 + "." + payloadB64 + "." + Buffer.from(sig).toString("base64");
        return osm;
    }

    /**
     *
     * @param osm OSM to verify
     * @param pkToken pkToken to verify with
     * @returns true if verification passes
     */
    public static async verifyOSM(osm: string, pkToken: string): Promise<boolean> {
        const [osmHeader, payload, osmSig] = osm.split(".");
        const osmHeaderJSON = this.b64ToJSON<osmHeaderJSON>(osmHeader);
        const cicJSON = this.b64ToJSON(pkToken.split(".")[0]) as cicJSON;

        //challenge: check typ & alg, kid commits to the pkt,
        if (!(osmHeaderJSON.typ === "osm")) return false;
        if (!(osmHeaderJSON.alg === cicJSON.alg)) return false;
        if (!(osmHeaderJSON.kid === this.hashHelper(Buffer.from(pkToken)).toString("base64")))
            return false;

        //challenge response:
        if (!this.verifyPKToken(pkToken)) return false;

        //verify: check signature on osm verifies under upk in pkt
        const userPubKey = await this.importKey(cicJSON.upk, false);
        const ver = await window.crypto.subtle.verify(
            ecdsaParams,
            userPubKey,
            await this.b64ToArrayBuffer(osmSig),
            this.generateSigData(osmHeader, payload)
        );
        console.log("Verified OSM", ver);
        if (!ver) return false;
        return true;
    }
}
