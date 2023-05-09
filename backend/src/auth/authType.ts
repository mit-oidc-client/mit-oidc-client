import { JWK } from "jwk-to-pem";

/**
 * Expected response format after querying OIDC /token endpoint 
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
 * Expected response from OIDC /jwk endpoint
 */
interface jwkResponse {
    keys: JWK
}

/**
 * Expected response for server to return to user's browser after querying /login endpoint
 */
interface loginResponse {
    success: boolean,   //Whether or not the login succeeded
    error_msg: string,  //If failed, provide error message. Else, empty string.

    //If success, these values should be populated. Else, empty string.
    id_token: string, 
    email: string,
}

/**
 * Defines results from calling getUserInfo() function
 */
interface userInfoResponse {
    success: boolean,   //Whether or not we were able to get user's info
    error_msg: string,  //If failed, provide error message. Else, empty string.
    email: string,      //If success, provide user email. Else, empty string.
}

/**
 * Defines expected format of an OpenID Connect ID token
 */
interface idToken {
    iss: string, //Issuer of token
    sub: string, //Machine-readable identifier of the user at the OIDC server
    exp: number, //Timestamp of when token expires
    iat: number, //Timestamp of when token was issue
    auth_time: number, //Timestamp of when user last authenticated to MIT OIDC server
    aud: Array<string>, //A list of client_ids ("audience") the token is intended for
    nonce: string //The nonce value sent during the token request
}

export { 
    jwkResponse,
    loginResponse,
    oidcToken,
    userInfoResponse,
    idToken
}