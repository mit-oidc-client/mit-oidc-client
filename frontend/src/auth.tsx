import { AUTH_CONFIG } from "./authConfig";
import { generateRandomBytes, toHexString } from "./authHelper";
import Cookies from "universal-cookie";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "./authProvider";
import { opkService } from "./pktoken";

/**
 * Expected response for server to return to user's browser after querying /login endpoint
 */
interface loginResponse {
    success: boolean; //Whether or not the login succeeded
    error_msg: string; //If failed, provide error message. Else, empty string.

    //If success, these values should be populated. Else, empty string.
    id_token: string;
    email: string;
}

/**
 * Redirect user to OIDC Authentication Endpoint for login with necessary query parameters
 */
async function redirectToLogin() {
    //Generate new state and nonce values
    const state = toHexString(generateRandomBytes(AUTH_CONFIG.state_length)); //TODO: Cryptography bind value with a browser cookie
    // const nonce = generateRandomBytes(AUTH_CONFIG.nonce_length); //TODO: Save as a HTTP only session cookie
    // const nonce_hash = await window.crypto.subtle.digest("SHA-256", nonce).then((hashBuffer) => {
    //     const hashArray = new Uint8Array(hashBuffer);
    //     return toHexString(hashArray);
    // });
    const nonce_hash = await opkService.generateNonce();

    const params = new URLSearchParams();
    params.append("client_id", AUTH_CONFIG.client_id);
    params.append("response_type", AUTH_CONFIG.response_type);
    params.append("scope", AUTH_CONFIG.scope);
    params.append("redirect_uri", AUTH_CONFIG.redirect_uri);
    params.append("state", state);
    params.append("nonce", nonce_hash);

    //Store the state in localStorage (to be used for code validation)
    localStorage.setItem(AUTH_CONFIG.state_localstorage_name, state); //TODO: Do I need to set other security flags

    //Store the nonce as a Secure, SameSite cookie (to be sent to backend for ID token validation)
    const cookies = new Cookies();
    cookies.set(
        AUTH_CONFIG.nonce_cookie_name,
        // toHexString(nonce),
        nonce_hash,
        AUTH_CONFIG.nonce_cookie_options
    );

    const destinationURL = AUTH_CONFIG.auth_endpoint + "?" + params.toString();
    window.location.replace(destinationURL);
}

function OidcResponseHandler() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useAuth();

    const state = searchParams.get("state");
    const code = searchParams.get("code");

    let initialMsg: string;

    //Validate the state parameter we get back is what we generated on client side
    if (state === localStorage.getItem(AUTH_CONFIG.state_localstorage_name)) {
        initialMsg = "Waiting to hear back from server..."; //User logged in to OIDC page, but still needs to be logged
        //into our backend system.
    } else {
        initialMsg = "Login Failed. Please try again.";
    }
    localStorage.removeItem(AUTH_CONFIG.state_localstorage_name); //Remove state variable after validation

    const [loginMsg, setLoginMsg] = useState(initialMsg);
    /**
     * Should be called only once (e.g. upon successful login to OIDC endpoint).
     */
    useEffect(() => {
        //Note: We're using an async wrapper to make easier to work with
        //results from fetch() since useEffect is a synchronous function

        /**
         * Validates and sends the received user `code` to the backend
         * for token retrieval and validation, then parses the result
         * browser-side
         */
        async function sendCode(): Promise<void> {
            const requestOptions: RequestInit = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: code }),
                credentials: "include" //Should include nonce, which is an HTTPonly cookie
            };

            //Send user's code to backend server
            const response = await fetch(AUTH_CONFIG.login_uri, requestOptions);
            const data: loginResponse = await response.json();
            if (data.success) {
                //Login was successful! Expect id_token
                setLoginMsg("Login successful!");
                localStorage.setItem(AUTH_CONFIG.idtoken_localstorage_name, data.id_token); //Save id_token to local storage

                const pktoken = await opkService.generatePKToken(data.id_token);
                console.log("PKTOKEN GENERATED", pktoken);
                const ver = await opkService.verifyPKToken(pktoken);
                console.log("PKTOKEN VERIFIED", ver);

                const from = location.state?.from?.pathname || "/";
                auth.signin(data.email, () => {
                    //Redirect user back to their original location
                    navigate(from, { replace: true });
                });
            } else {
                //Login was unsuccessful. Let user know about error message.
                setLoginMsg(`Login failed! ${data.error_msg}`);
            }
        }

        sendCode();
    }, [navigate, code, auth, location]);

    return <div>{loginMsg}</div>;
}

export { redirectToLogin, OidcResponseHandler };
