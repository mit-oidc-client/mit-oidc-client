import { AUTH_CONFIG } from "./authConfig";
import { generateRandomBytes, toHexString } from "./authHelper";
import * as ed from "noble-ed25519";
import { SHA3 } from "sha3";
import jwt from "jsonwebtoken";
import { assert } from "console";
import axios from "axios";
import jwkToPem from "jwk-to-pem";
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

export class opkService {
    // private publicKey: Uint8Array;
    // private privateKey: Uint8Array;
    // private cic: cicJSON;
    // private pkString: string;
    // private skString: string;
    // private pkToken: string;

    // private static async generateKeys(): Promise<void> {
    //     // Create our keys
    //     const privateKey = ed.utils.randomPrivateKey();
    //     const publicKey = await ed.getPublicKey(privateKey);

    //     //TODO save to local storage

    //     // this.skString = Buffer.from(this.privateKey).toString("base64");
    //     // this.pkString = Buffer.from(this.publicKey).toString("base64");
    //     // console.log("generated keys");
    // }

    /**
     * Generates new nonce & key pair
     * @returns Promise of nonce
     */
    public static async generateNonce(): Promise<string> {
        // this.generateKeys();
        const privateKey = ed.utils.randomPrivateKey();
        const publicKey = await ed.getPublicKey(privateKey);

        const pkString = Buffer.from(publicKey).toString("base64");
        const skString = Buffer.from(privateKey).toString("base64");

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

    /**
     * Generates a pkToken from a given idToken
     *
     * @param idToken idToken returned by OP, as a b64 string/JWT
     */
    public static generatePKToken(idToken: string): string {
        //make protected header from cic
        //sign w private key
        //add signature,header to id token

        const privateKey = Buffer.from(localStorage.getItem("opk_private_key") || "", "base64");
        const cic = this.b64ToJSON(localStorage.getItem("opk_cic") || "");

        const [opHeader, payload, opSig] = idToken.split(".");
        const payloadJSONString = JSON.stringify(this.b64ToJSON(payload));
        const opkJWT = jwt
            .sign(payloadJSONString, privateKey, { header: cic as cicJSON })
            .split(".");
        const userSig = opkJWT[2];
        const userHeader = opkJWT[0];

        const pkToken = userHeader + "." + opHeader + "." + payload + "." + opSig + "." + userSig;

        localStorage.setItem("opk_pktoken", pkToken);
        return pkToken;
    }

    /**
     * Checks if a pkToken is valid. Throws error if invalid
     * @param pkToken pkToken as a JWS of the form userHeader.opHeader.payload.opSig.userSig
     */
    public static async verifyPKToken(pkToken: string): Promise<void> {
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
        assert(payloadJSON.aud.includes(AUTH_CONFIG.client_id));
        assert(payloadJSON.iss === "https://oidc.mit.edu/");

        //verify OP signature
        //Fetch the OIDC server public key
        const oidcPublicKeys = (await axios.get<jwkResponse>(AUTH_CONFIG.public_key)).data;

        if ("keys" in oidcPublicKeys && Array.isArray(oidcPublicKeys.keys)) {
            const firstKey = oidcPublicKeys.keys[0];
            const pemPublicKey = jwkToPem(firstKey);
            assert(jwt.verify(opToken, pemPublicKey));
        } else {
            assert(false, "no openid public key available");
        }

        //check nonce = sha3(cic)
        const nonce = payloadJSON.nonce;
        assert(this.hashHelper(Buffer.from(cicString, "utf8")).toString("base64") === nonce);

        //unpack nonce & verify pk signature
        const userPubKey = Buffer.from(cicJSON.upk, "base64");
        //check cic is well formed (has alg,rz,upk)
        assert(jwt.verify(userHeader + "." + payload + "." + userSig, userPubKey));
    }

    public static generateOSM(message: string): string {
        //TODO get cic, pktoken, privatekey from localstorage
        const cic = JSON.parse(localStorage.getItem("opk_cic") || "");
        const pkToken = localStorage.getItem("opk_pktoken") || "";
        const privateKey = Buffer.from(localStorage.getItem("opk_private_key") || "", "base64");

        const header = {
            alg: cic.alg,
            kid: this.hashHelper(Buffer.from(pkToken, "utf8")).toString("base64"),
            typ: "osm"
        };
        const osm = jwt.sign(message, privateKey, { header: header });
        return osm;
    }

    public static verifyOSM(osm: string, pkToken: string): void {
        const [osmHeader, payload, osmSig] = osm.split(".");
        const osmHeaderJSON = this.b64ToJSON<osmHeaderJSON>(osmHeader);
        const pkTokenJSON = JSON.parse(pkToken);
        //challenge: check typ & alg, kid commits to the pkt,
        assert(osmHeaderJSON.typ === "osm");
        assert(osmHeaderJSON.alg === pkTokenJSON.cic.alg);
        assert(osmHeaderJSON.kid === this.hashHelper(Buffer.from(pkToken)).toString("base64"));
        //challenge response:
        this.verifyPKToken(pkToken);
        //verify: check signature on osm verifies under upk in pkt
        const userPubKey = Buffer.from(pkTokenJSON.cic.upk, "base64");
        assert(jwt.verify(osm, userPubKey));
    }
}
