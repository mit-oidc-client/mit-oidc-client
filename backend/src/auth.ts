import { Request, Response, response } from 'express';
import { JWK } from "jwk-to-pem";
import axios from 'axios';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';

import { AUTH_CONFIG } from './authConfig';
import { eqSet } from "./authHelper";

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
    iss: string,
    sub: string,
    exp: string,
    iat: string,
    auth_time: string,
    aud: Array<string>,
    nonce: string,
}

/**
 * Handles the login procedure given an OpenID auth code (which may or may not be valid)
 */
async function handleLogin(req: Request, res: Response) {
    console.log(req.body);
    const code = req.body["code"];
    const userResponse: loginResponse = { //Response we will send back to user
        success: true,
        error_msg: "",
        id_token: "",
        email: ""
    }

    /**
     * Helper function: Given an error message,
     * output a JSON response to user with that error.
     * 
     * Side effect: Will exit prematurely from handleLogin() due to sending respond.
     * 
     * Note: For our system we're choosing to output the error to the user/browser. However,
     * if you don't want to leak the reason why we failed to authenticate, you can
     * alternatively write the error_msg to a server-side log instead.
     */
    function respondWithError(errorMsg:string) {
        userResponse.success = false;
        userResponse.error_msg = errorMsg;
        res.status(200).json(userResponse);
    }

    //Send code to OIDC to get back token
    let oidcResponse;
    try {
        oidcResponse = await axios.post<oidcToken>(AUTH_CONFIG.token_endpoint, new URLSearchParams({
            grant_type: AUTH_CONFIG.grantType,
            code: code,
            redirect_uri: AUTH_CONFIG.redirect_uri
        }),
        {
            auth: {
                username: AUTH_CONFIG.client_id,
                password: AUTH_CONFIG.client_secret
            }
        });
    } catch(error) {
        respondWithError("Invalid user code was provided");
    }

    //TODO: Check error code of response to see that we didn't send it a bad code
    const oidcJSON: oidcToken = oidcResponse.data;

    //Verify that user provided us with necessary scope
    const hasToken = oidcJSON.hasOwnProperty("id_token");
    const hasScope = oidcJSON.hasOwnProperty("scope");

    const expectedScope = new Set(AUTH_CONFIG.scope.split(" "));
    const givenScope = ((hasScope && oidcJSON.scope)? new Set<String>(oidcJSON.scope.split(" ")): new Set<String>());
    
    const hasFullScope = eqSet(expectedScope, givenScope);
    
    if(!hasFullScope || !hasToken) {
        respondWithError("Please make sure you allow the necessary scopes!");
    }

    //TODO: Check token_type is correct
    const correctTokenType = (oidcJSON.token_type === AUTH_CONFIG.tokenType);
    if(!correctTokenType) {
        respondWithError("Token type received from OIDC did not match up with what was expected");
    }

    //TODO: Store refresh_token (first need to ask for offline_access first)

    //Proceed to validate ID token and fetch information about the user
    if(oidcJSON.id_token) {

        //Fetch the OIDC server public key
        const oidcPublicKeys = (await axios.get<jwkResponse>(AUTH_CONFIG.public_key)).data;

        if("keys" in oidcPublicKeys && Array.isArray(oidcPublicKeys.keys)) {
            const firstKey = oidcPublicKeys.keys[0]; 
            const pemPublicKey = jwkToPem(firstKey);

            let decoded: idToken;
            try {
                //Verify the token, and if valid, return the decoded payload
                decoded = jwt.verify(oidcJSON.id_token,pemPublicKey); 
                //console.log("Decoded",decoded);
            } catch(error) {
                //Handle issue with token not having valid signature
                respondWithError("OIDC error: Invalid signature in OIDC ID token");
                return;
            }
            //Proceed to do more checking...
            //e.g., validate all parts of the ID token claims
            const correctIssuer = (decoded.iss === AUTH_CONFIG.tokenIssuer)
            

            //Assured that ID token is valid, try to query user information
            //to retrieve profile info
            const profileResults = await getUserInfo(oidcJSON.access_token, decoded);

            if(profileResults.success){
                userResponse.success = true;
                userResponse.id_token = oidcJSON.id_token;
                userResponse.email = profileResults.email;
                res.status(200).json(userResponse);
            } else {
                userResponse.success = false;
                userResponse.error_msg = profileResults.error_msg;
                res.status(200).json(userResponse);
            }
        }
    }
}

/**
 * Given a valid access_token and id_token (parsed into its object representation),
 * query the OIDC User Information endpoint and return profile info.
 * 
 * Query follows process described in: https://datatracker.ietf.org/doc/html/rfc6750#section-2.1
 * 
 * For our basic example case, we will just or the user's email (defined in our authConfig.ts' scope)
 * 
 * Returns: user's email (string), which is empty string if it fails to resolve
 * */
async function getUserInfo(access_token: string, id_token: object): Promise<userInfoResponse> {

    const userInfoResults:userInfoResponse = {
        success: true,
        error_msg: "",
        email: "",
    }
    console.log("access_token:",access_token);
    let oidcResponse;
    try {
        oidcResponse = await axios.get(AUTH_CONFIG.user_info_endpoint,
            { headers: {"Authorization" : `Bearer ${access_token}`} });
        //TODO: Verify that the `sub` in the response MUST match what is in the id_token
        //TODO: The Client MUST verify that the OP that responded was the intended OP through a TLS server certificate check, per RFC 6125 [RFC6125]. 
        
        userInfoResults.email = oidcResponse.data.email; //Get email from JSON object
        console.log("email",oidcResponse.data.email);
    } catch(error) {
        console.log(error);
        userInfoResults.success = false;
        userInfoResults.error_msg = "Request to OIDC user endpoint to retrieve profile info errored out."
        userInfoResults.email = "";
    }

    return userInfoResults;
}

export { handleLogin } 