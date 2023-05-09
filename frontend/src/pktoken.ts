import { AUTH_CONFIG } from "./authConfig";
import { generateRandomBytes, toHexString } from "./authHelper";
// import * as ed from "noble-ed25519";
import { SHA3 } from "sha3";
// import jwt, { JsonWebTokenError } from "jsonwebtoken";
import axios from "axios";
// import jwkToPem from "jwk-to-pem";
import * as jwkpem from "jwk-to-pem";

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
const ecdsaParams = {
    name: "ECDSA",
    namedCurve: "P-384"
};
const openIDAlg = "RSASSA-PKCS1-v1_5";
export class opkService {
    /**
     * Generates new nonce & key pair
     * @returns Promise of nonce
     */
    public static async generateNonce(): Promise<string> {
        // this.generateKeys();
        // const privateKey = ed.utils.randomPrivateKey();
        // const publicKey = await ed.getPublicKey(privateKey);

        const keypair = await window.crypto.subtle.generateKey(ecdsaParams, true, [
            "sign",
            "verify"
        ]);

        const pkString = await this.exportKey(keypair.publicKey);
        const skString = await this.exportKey(keypair.privateKey);
        console.log(pkString, skString);

        localStorage.setItem("opk_public_key", pkString);
        localStorage.setItem("opk_private_key", skString);

        const alg = "ECDSA";
        const rz = toHexString(generateRandomBytes(AUTH_CONFIG.state_length));

        const cic = { upk: pkString, alg: alg, rz: rz };
        const cicString = JSON.stringify(cic);
        const nonce = this.hashHelper(Buffer.from(cicString, "utf8")).toString("base64");

        localStorage.setItem("opk_cic", cicString);

        console.log("created new nonce", nonce);
        return nonce;
    }

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

    private static JSONtob64(json: JSON): string {
        const jsonString = JSON.stringify(json);
        return Buffer.from(jsonString, "utf8").toString("base64");
    }

    // private static async exportKey(key: CryptoKey): Promise<string> {
    //     const keyAsJwk = await window.crypto.subtle.exportKey("jwk", key);
    //     return this.JSONtob64(keyAsJwk as JSON);
    // }

    // private static async importKey(b64: string): Promise<CryptoKey> {
    //     const key = this.b64ToJSON(b64);
    //     const keyAsCrypto = await window.crypto.subtle.importKey("jwk", key, ecdsaParams, true, [
    //         "sign",
    //         "verify"
    //     ]);
    //     return keyAsCrypto;
    // }

    private static async exportKey(key: CryptoKey): Promise<string> {
        const keyExport: ArrayBuffer = await window.crypto.subtle.exportKey("raw", key);
        return Buffer.from(keyExport).toString("base64");
    }

    private static async importKey(b64: string): Promise<CryptoKey> {
        const key: Buffer = Buffer.from(b64);
        const keyAsCrypto: CryptoKey = await window.crypto.subtle.importKey(
            "raw",
            key,
            ecdsaParams,
            true,
            ["sign", "verify"]
        );
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
     * Generates a pkToken from a given idToken
     *
     * @param idToken idToken returned by OP, as a b64 string/JWT
     */
    public static async generatePKToken(idToken: string): Promise<string> {
        //make protected header from cic
        //sign w private key
        //add signature,header to id token

        const privateKey: CryptoKey = await this.importKey(
            localStorage.getItem("opk_private_key") || ""
        );
        const cic: JSON = this.b64ToJSON(localStorage.getItem("opk_cic") || "");

        const [opHeader, payload, opSig] = idToken.split(".");
        const payloadJSONString = JSON.stringify(this.b64ToJSON(payload));
        // const opkJWT = jwt
        //     .sign(payloadJSONString, privateKey, { header: cic as cicJSON })
        //     .split(".");

        // const userSig = opkJWT[2];
        // const userHeader = opkJWT[0];
        const userHeader = this.JSONtob64(cic);
        const userSigBuf = await window.crypto.subtle.sign(
            ecdsaParams,
            privateKey,
            Buffer.from(payloadJSONString + JSON.stringify(cic), "utf8")
        );
        const userSig = this.arrayBufferTob64(userSigBuf);

        const pkToken = userHeader + "." + opHeader + "." + payload + "." + opSig + "." + userSig;

        localStorage.setItem("opk_pktoken", pkToken);
        console.log(payloadJSONString);
        console.log(pkToken);
        return pkToken;
    }

    /**
     * Checks if a pkToken is valid. Throws error if invalid
     * @param pkToken pkToken as a JWS of the form userHeader.opHeader.payload.opSig.userSig
     */
    public static async verifyPKToken(pkToken: string): Promise<boolean> {
        //check client id, aud, iss
        //extract kid from OP header
        //uses kid to get PKo and verify OP signature
        //check nonce = sha3(cic from pkt header)
        //use cic stuff to verify pk signature
        const [userHeader, opHeader, payload, opSig, userSig] = pkToken.split(".");
        const opToken = opHeader + payload + opSig;

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
            // const pemPublicKey = jwkToPem(firstKey);
            // if (!jwt.verify(opToken, opPubKey)) return false;
            const opKey = await window.crypto.subtle.importKey("jwk", firstKey, openIDAlg, true, [
                "verify"
            ]);
            const ver = await window.crypto.subtle.verify(
                openIDAlg,
                opKey,
                await this.b64ToArrayBuffer(opSig),
                await this.b64ToArrayBuffer(opHeader + payload)
            );
            if (!ver) throw Error("invalid id token");
        } else {
            return false;
        }

        //check nonce = sha3(cic)
        const nonce = payloadJSON.nonce;
        if (!(this.hashHelper(Buffer.from(cicString, "utf8")).toString("base64") === nonce))
            return false;

        //unpack nonce & verify pk signature
        // const userPubKey = Buffer.from(cicJSON.upk, "base64");
        const userPubKey = await this.importKey(cicJSON.upk);
        //check cic is well formed (has alg,rz,upk)
        // if (!jwt.verify(userHeader + "." + payload + "." + userSig, userPubKey)) return false;
        const ver = await window.crypto.subtle.verify(
            ecdsaParams,
            userPubKey,
            await this.b64ToArrayBuffer(userSig),
            await this.b64ToArrayBuffer(userHeader + payload)
        );
        if (!ver) throw Error("invalid id token");
        return true;
    }

    public static async generateOSM(message: string): Promise<string> {
        const cic = JSON.parse(localStorage.getItem("opk_cic") || "");
        const pkToken = localStorage.getItem("opk_pktoken") || "";
        const privateKey = await this.importKey(localStorage.getItem("opk_private_key") || "");

        const header: any = {
            alg: cic.alg,
            kid: this.hashHelper(Buffer.from(pkToken, "utf8")).toString("base64"),
            typ: "osm"
        };
        const headerJSON = header as JSON;
        // const osm = jwt.sign(message, privateKey, { header: header });
        // const osm = await new jose.SignJWT(message).setProtectedHeader({ header }).sign(privateKey);
        const sigData = Buffer.from("TODO");
        const sig = window.crypto.subtle.sign(ecdsaParams, privateKey, sigData);
        const osm =
            this.JSONtob64(headerJSON) + "." + Buffer.from(message).toString("base64") + "." + sig;
        return osm;
    }

    public static async verifyOSM(osm: string, pkToken: string): Promise<boolean> {
        const [osmHeader, payload, osmSig] = osm.split(".");
        const osmHeaderJSON = this.b64ToJSON<osmHeaderJSON>(osmHeader);
        const pkTokenJSON = JSON.parse(pkToken);
        //challenge: check typ & alg, kid commits to the pkt,
        if (!(osmHeaderJSON.typ === "osm")) return false;
        if (!(osmHeaderJSON.alg === pkTokenJSON.cic.alg)) return false;
        if (!(osmHeaderJSON.kid === this.hashHelper(Buffer.from(pkToken)).toString("base64")))
            return false;
        //challenge response:
        this.verifyPKToken(pkToken);
        //verify: check signature on osm verifies under upk in pkt
        const userPubKey = await this.importKey(pkTokenJSON.cic.upk);
        // if (!jwt.verify(osm, userPubKey)) return false;
        const ver = await window.crypto.subtle.verify(
            ecdsaParams,
            userPubKey,
            await this.b64ToArrayBuffer(osmSig),
            await this.b64ToArrayBuffer(osmHeader + payload)
        );
        if (!ver) throw Error("invalid id token");
        return true;
    }
}
