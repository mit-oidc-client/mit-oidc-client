import { Request, Response } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import { AUTH_CONFIG } from "./authConfig";
import { eqSet } from "./authHelper";
import { jwkResponse, loginResponse, oidcToken, userInfoResponse, idToken } from "./authType";
/**
 * Handles the login procedure given an OpenID auth code (which may or may not be valid)
 */
async function handleLogin(req: Request, res: Response) {
    const code = req.body["code"];
    const userResponse: loginResponse = {
        //Response we will send back to user/browser
        success: true,
        error_msg: "",
        id_token: "",
        email: ""
    };
    /**
     * Helper function: Instruct the client browser to clear the nonce cookie
     *
     * Note: We include the original cookie options because most browsers are set to
     * clear only when then the options provided in clear header are identical to
     * the original cookie
     */
    function clearNonceCookie() {
        res.clearCookie(AUTH_CONFIG.nonce_cookie_name, AUTH_CONFIG.nonce_cookie_options);
    }
    /**
     * Helper function: Given an error message,
     * output a JSON response to user with that error.
     *
     * Note: For our system we're choosing to output the error to the user/browser. However,
     * if you don't want to leak the reason why we failed to authenticate, you can
     * alternatively write the error_msg to output to a server-side log instead (Not implemented).
     */
    function respondWithError(errorMsg: string) {
        userResponse.success = false;
        userResponse.error_msg = errorMsg;
        clearNonceCookie();
        res.status(200).json(userResponse);
    }

    //Check if code was provided
    if(code === undefined) {
        respondWithError("Input Error: No auth code was provided in request");
        return;
    }
    
    //Check if nonce cookie was provided
    if (!(AUTH_CONFIG.nonce_cookie_name in req.cookies)) {
        respondWithError("Input Error: No nonce cookie was provided in request");
        return;
    }
    const nonceCookie: string = req.cookies[AUTH_CONFIG.nonce_cookie_name];

    //Send code to OIDC to get back token
    let oidcResponse;
    try {
        oidcResponse = await axios.post<oidcToken>(
            AUTH_CONFIG.token_endpoint,
            new URLSearchParams({
                grant_type: AUTH_CONFIG.grantType,
                code: code,
                redirect_uri: AUTH_CONFIG.redirect_uri
            }),
            {
                auth: {
                    username: AUTH_CONFIG.client_id,
                    password: AUTH_CONFIG.client_secret
                }
            }
        );
    } catch (error) {
        respondWithError("Input Error: Invalid user code was provided");
        return;
    }
    const oidcJSON: oidcToken = oidcResponse.data;

    //Verify that user provided us with necessary scope
    const hasToken = oidcJSON.hasOwnProperty("id_token");
    const hasScope = oidcJSON.hasOwnProperty("scope");
    const expectedScope = new Set(AUTH_CONFIG.scope.split(" "));
    const givenScope =
        hasScope && oidcJSON.scope ? new Set<String>(oidcJSON.scope.split(" ")) : new Set<String>();
    const hasFullScope = eqSet(expectedScope, givenScope);
    if (!hasFullScope || !hasToken) {
        respondWithError("User Error: Please make sure you allow the necessary scopes!");
        return;
    }

    //Check token_type is correct
    const correctTokenType = oidcJSON.token_type === AUTH_CONFIG.tokenType;
    if (!correctTokenType) {
        respondWithError("OIDC error: Unexpected token type received in ID token");
        return;
    }

    //TODO: Store refresh_token (first need to ask for offline_access first)

    //Proceed to validate ID token and fetch information about the user
    if (oidcJSON.id_token) {
        //Fetch the OIDC server public key
        const oidcPublicKeys = (await axios.get<jwkResponse>(AUTH_CONFIG.public_key)).data;
        if ("keys" in oidcPublicKeys && Array.isArray(oidcPublicKeys.keys)) {
            const firstKey = oidcPublicKeys.keys[0];
            const pemPublicKey = jwkToPem(firstKey);
            let decoded: idToken;
            try {
                //Verify the token, and if valid, return the decoded payload
                decoded = jwt.verify(oidcJSON.id_token, pemPublicKey);
            } catch (error) {
                //Handle issue with token not having valid signature
                return respondWithError("OIDC error: Invalid signature in OIDC ID token");
            }
            //Validate the issuer
            const correctIssuer = decoded.iss === AUTH_CONFIG.tokenIssuer;
            if (!correctIssuer)
                return respondWithError("OIDC Error: Issuer of token is not as expected");

            const currTimeSeconds = Math.floor(Date.now() / 1000); //Note: Timestamps in ID tokens are measured in seconds

            //Validate the expiration and issue time stamps
            if (decoded.exp < currTimeSeconds)
                return respondWithError("OIDC Error: Given ID token has already expired");
            if (decoded.iat > currTimeSeconds)
                return respondWithError("OIDC Error: Given ID token is issued in the future");

            //Validate nonce in ID token matches one sent during token request
            // const nonceHash = createHash('sha256').update(nonceCookie,"hex").digest('hex'); //Need to re-hash nonce
            const nonceMatches = decoded.nonce === nonceCookie;
            if (!nonceMatches)
                return respondWithError(
                    "OIDC Error: Nonce in ID token doesn't match up with original value"
                );

            //Validate client_id included in audiences list
            const clientIdInAudience = decoded.aud.includes(AUTH_CONFIG.client_id);
            if (!clientIdInAudience)
                return respondWithError(
                    "OIDC Error: Audience list in ID token doesn't include our app's client id"
                );

            //Assured that ID token is valid, try to query user information using access token
            const profileResults = await getUserInfo(oidcJSON.access_token, decoded);

            if (profileResults.success) {
                userResponse.success = true;
                userResponse.id_token = oidcJSON.id_token;
                userResponse.email = profileResults.email;
                clearNonceCookie();
                res.status(200).json(userResponse);
            } else {
                userResponse.success = false;
                userResponse.error_msg = profileResults.error_msg;
                clearNonceCookie();
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
    const userInfoResults: userInfoResponse = {
        success: true,
        error_msg: "",
        email: ""
    };
    let oidcResponse;
    try {
        oidcResponse = await axios.get(AUTH_CONFIG.user_info_endpoint, {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        //TODO: Verify that the `sub` in the response MUST match what is in the id_token
        //TODO: The Client MUST verify that the OP that responded was the intended OP through a TLS server certificate check, per RFC 6125 [RFC6125].

        userInfoResults.email = oidcResponse.data.email; //Get email from JSON object
    } catch (error) {
        userInfoResults.success = false;
        userInfoResults.error_msg =
            "Request to OIDC user endpoint to retrieve profile info errored out.";
        userInfoResults.email = "";
    }

    return userInfoResults;
}

export { handleLogin };
