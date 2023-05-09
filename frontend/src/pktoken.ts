import { AUTH_CONFIG } from "./authConfig";
import { generateRandomBytes, toHexString } from "./authHelper";
// import * as ed from "noble-ed25519";
import { SHA3 } from "sha3";
// import jwt, { JsonWebTokenError } from "jsonwebtoken";
import axios from "axios";
// import jwkToPem from "jwk-to-pem";
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
    // kid: string;
    // x5t: string;
    // x5c: string[];
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

    private static JSONtob64(json: JSON): string {
        const jsonString = JSON.stringify(json);
        return Buffer.from(jsonString, "utf8").toString("base64");
    }

    private static async exportKey(key: CryptoKey): Promise<string> {
        console.log("in export key");
        const keyAsJwk: JWK = await window.crypto.subtle.exportKey("jwk", key);
        console.log("exported");
        return this.JSONtob64(keyAsJwk as JSON);
    }

    private static async importKey(b64: string, signing: boolean): Promise<CryptoKey> {
        console.log("in importkey");
        const key = this.b64ToJSON(b64) as JWK;
        console.log("jwk formate");
        console.log(key);
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
        console.log("cryptokey format");
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

    private static generateSigData(header: string, payload: string): Buffer {
        return Buffer.from(header + "." + payload, "utf-8");
    }

    private static async generateKeys(): Promise<void> {
        console.log("in genKeys");
        const keypair = await window.crypto.subtle.generateKey(ecdsaGenParams, true, [
            "sign",
            "verify"
        ]);
        console.log("keys generated");
        const pkString = await this.exportKey(keypair.publicKey);
        const skString = await this.exportKey(keypair.privateKey);
        console.log(pkString, skString);

        localStorage.setItem("opk_public_key", pkString);
        localStorage.setItem("opk_private_key", skString);
    }

    /**
     * Generates new nonce & key pair
     * @returns Promise of nonce
     */
    public static async generateNonce(): Promise<string> {
        // this.generateKeys();
        // const privateKey = ed.utils.randomPrivateKey();
        // const publicKey = await ed.getPublicKey(privateKey);
        console.log("in gennonce");
        console.log("ree" + localStorage.getItem("opk_public_key"));
        if (localStorage.getItem("opk_public_key") === null) {
            console.log("no keys found, generating keys now");
            await this.generateKeys();
            console.log("keys generated");
        }
        const pkString = localStorage.getItem("opk_public_key") || "";
        console.log("pkstring for nonce", pkString);
        const alg = "ECDSA";
        const rz = toHexString(generateRandomBytes(AUTH_CONFIG.state_length));

        const cic = { upk: pkString, alg: alg, rz: rz };
        const cicString = JSON.stringify(cic);
        const nonce = this.hashHelper(Buffer.from(cicString, "utf8")).toString("base64");

        localStorage.setItem("opk_cic", cicString);
        console.log("set cic", cicString);

        console.log("created new nonce", nonce);
        return nonce;
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
        console.log("in genpkt");
        const privateKey: CryptoKey = await this.importKey(
            localStorage.getItem("opk_private_key") || "",
            true
        );
        console.log("private key loaded");
        const cic: JSON = JSON.parse(localStorage.getItem("opk_cic") || "");
        console.log("cic loaded", cic);
        const [opHeader, payload, opSig] = idToken.split(".");
        const payloadJSONString = JSON.stringify(this.b64ToJSON(payload));
        // const opkJWT = jwt
        //     .sign(payloadJSONString, privateKey, { header: cic as cicJSON })
        //     .split(".");

        // const userSig = opkJWT[2];
        // const userHeader = opkJWT[0];
        console.log("idtoken", idToken);
        console.log(payloadJSONString);
        const userHeader = this.JSONtob64(cic);
        const userSigBuf = await window.crypto.subtle.sign(
            ecdsaParams,
            privateKey,
            this.generateSigData(userHeader, payload)
        );
        const userSig = await this.arrayBufferTob64(userSigBuf);
        console.log("user sig", userSig);
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
        console.log("in verifypktoken");
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
        console.log(cicJSON);
        console.log(payloadJSON);
        //check client id, aud, iss
        if (!payloadJSON.aud.includes(AUTH_CONFIG.client_id)) return false;
        console.log("passed aud");
        if (!(payloadJSON.iss === "https://oidc.mit.edu/")) return false;
        console.log("passed iss");

        //verify OP signature
        //Fetch the OIDC server public key
        const oidcPublicKeys = (await axios.get<jwkResponse>(AUTH_CONFIG.public_key)).data;
        console.log("fetched oidc pks");
        if ("keys" in oidcPublicKeys && Array.isArray(oidcPublicKeys.keys)) {
            const firstKey = oidcPublicKeys.keys[0];
            // const pemPublicKey = jwkToPem(firstKey);
            // if (!jwt.verify(opToken, opPubKey)) return false;
            console.log("opkey", firstKey);
            const opKey = await window.crypto.subtle.importKey(
                "jwk",
                firstKey,
                openIDAlgImport,
                true,
                ["verify"]
            );
            console.log("imported opkey", opKey);
            const verIdToken = await window.crypto.subtle.verify(
                openIDAlg,
                opKey,
                await this.b64ToArrayBuffer(opSig),
                this.generateSigData(opHeader, payload)
            );
            console.log("ver", verIdToken);
            if (!verIdToken) throw Error("invalid id token");
        } else {
            return false;
        }
        //START FAKE CODE
        // const opKeyJWK = {
        //     e: "AQAB",
        //     n: "pkkVnbFUJXn6Za9zOoJpmnlZFDocyOAKQFJli3PuYaMkCS1UI0BT2Mt0NkeFw84hiMhUvVEFpUPT4CytvVccNjSbCEBdm_TMCZj0hbISLtjO_CUi7NbyzINCw2KpXpxFFVt3sJmKidCREXy06mOrCS66KE2t8oxnPpEWbma-fXLH13i1YSJMOePJvx3piAQVy76Os9NV8dPlWf5wyjSP8OooSc_ZX6tq11IRfQPTKuGyNunLeWDHvY1rwsAtGO3iwcnthP3yMeAmhg69y-sBcWn5_GGRbFh1sEk18Yl6d7X5zqSQWB_9a-UaeAplCJmD3tUEWDu9e-1nDdmwK6sXtw",
        //     kty: "RSA",
        //     kid: "rsa1"
        // } as JWK;
        // console.log("opkey", opKeyJWK);
        // const opKey = await window.crypto.subtle.importKey("jwk", opKeyJWK, openIDAlgImport, true, [
        //     "verify"
        // ]);
        // console.log("imported opkey", opKey);
        // const verIdToken = await window.crypto.subtle.verify(
        //     openIDAlg,
        //     opKey,
        //     await this.b64ToArrayBuffer(opSig),
        //     this.generateSigData(opHeader, payload)
        // );
        // console.log("ver", verIdToken);
        // if (!verIdToken) throw Error("invalid id token");

        //END FAKE CODE

        //check nonce = sha3(cic)
        const nonce = payloadJSON.nonce;
        console.log("nonce", nonce);
        console.log(this.hashHelper(Buffer.from(cicString, "utf8")).toString("base64"));
        if (!(this.hashHelper(Buffer.from(cicString, "utf8")).toString("base64") === nonce))
            return false;
        console.log("checked nonce");
        //unpack nonce & verify pk signature
        const userPubKey = await this.importKey(cicJSON.upk, false);
        console.log("loaded user pk", userPubKey);
        //check cic is well formed (has alg,rz,upk)
        // if (!jwt.verify(userHeader + "." + payload + "." + userSig, userPubKey)) return false;
        const ver = await window.crypto.subtle.verify(
            ecdsaParams,
            userPubKey,
            await this.b64ToArrayBuffer(userSig),
            this.generateSigData(userHeader, payload)
        );
        console.log("verifying pktoken", ver);
        if (!ver) throw Error("invalid id token");
        return true;
    }

    public static async generateOSM(message: string): Promise<string> {
        console.log("in genOsm");
        const cic = JSON.parse(localStorage.getItem("opk_cic") || "");
        const pkToken = localStorage.getItem("opk_pktoken") || "";
        const privateKey = await this.importKey(
            localStorage.getItem("opk_private_key") || "",
            true
        );
        console.log("cic", cic);
        console.log("pktoken", pkToken);
        console.log("private key", privateKey);

        const header: any = {
            alg: cic.alg,
            kid: this.hashHelper(Buffer.from(pkToken, "utf8")).toString("base64"),
            typ: "osm"
        };
        const headerJSON = header as JSON;
        const payloadB64 = Buffer.from(message).toString("base64");
        const headerB64 = this.JSONtob64(headerJSON);
        // const osm = jwt.sign(message, privateKey, { header: header });
        // const osm = await new jose.SignJWT(message).setProtectedHeader({ header }).sign(privateKey);
        const sigData = this.generateSigData(headerB64, payloadB64);
        const sig = await window.crypto.subtle.sign(ecdsaParams, privateKey, sigData);
        console.log("SIGNATURE", sig);
        const osm = headerB64 + "." + payloadB64 + "." + Buffer.from(sig).toString("base64");
        return osm;
    }

    public static async verifyOSM(osm: string, pkToken: string): Promise<boolean> {
        console.log("in verOSM");
        const [osmHeader, payload, osmSig] = osm.split(".");
        console.log(osmHeader);
        const osmHeaderJSON = this.b64ToJSON<osmHeaderJSON>(osmHeader);
        console.log(osmHeaderJSON);
        const cicJSON = this.b64ToJSON(pkToken.split(".")[0]) as cicJSON;
        console.log(cicJSON);
        //challenge: check typ & alg, kid commits to the pkt,
        if (!(osmHeaderJSON.typ === "osm")) return false;
        if (!(osmHeaderJSON.alg === cicJSON.alg)) return false;
        if (!(osmHeaderJSON.kid === this.hashHelper(Buffer.from(pkToken)).toString("base64")))
            return false;
        //challenge response:
        console.log("about to check pktoken");
        this.verifyPKToken(pkToken);
        //verify: check signature on osm verifies under upk in pkt
        const userPubKey = await this.importKey(cicJSON.upk, false);
        console.log("loaded upk");
        // if (!jwt.verify(osm, userPubKey)) return false;
        const ver = await window.crypto.subtle.verify(
            ecdsaParams,
            userPubKey,
            await this.b64ToArrayBuffer(osmSig),
            this.generateSigData(osmHeader, payload)
        );
        console.log(ver);
        if (!ver) throw Error("invalid signature on OSM");
        return true;
    }
}
