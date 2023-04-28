import {AxiosResponse} from 'axios';
import { JWK } from "jwk-to-pem";
/**
 * Expected response format after querying /token endpoint of OIDC server
*/
interface oidcToken {
    id_token?: string,
    access_token: string,
    token_type: string,
    expires_in: number,
    refresh_token?: string,
    scope?: string
}

/**
 * Expected response format for server to return to user after querying /login endpoint
 */
interface loginResponse {
    success: boolean,   //Whether or not the login succeeded
    error_msg: string,  //If not success, provide error message. Else, empty string.
    id_token: string,   //If success, provide validated id_token. Else, empty string.
}

interface jwkResponse {
    keys: JWK
}

export { oidcToken, jwkResponse, loginResponse } 