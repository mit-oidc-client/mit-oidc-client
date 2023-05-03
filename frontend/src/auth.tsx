import { AUTH_CONFIG } from "./authConfig";
import { generateRandomBytes, toHexString} from "./authHelper";
import Cookies from 'universal-cookie';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from "./authProvider";
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
 * Redirect user to OIDC Authentication Endpoint for login with necessary query parameters
 */
async function redirectToLogin() {

  //Generate new state and nonce values
  const state = toHexString(generateRandomBytes(AUTH_CONFIG.state_length)); //TODO: Cryptography bind value with a browser cookie
  const nonce = generateRandomBytes(AUTH_CONFIG.state_length); //TODO: Save as a HTTP only session cookie
  const nonce_hash = await window.crypto.subtle.digest('SHA-256',nonce).then((hashBuffer)=> {
      const hashArray = new Uint8Array(hashBuffer);
      return toHexString(hashArray);
  }); 

  const params = new URLSearchParams();
  params.append("client_id",AUTH_CONFIG.client_id);
  params.append("response_type",AUTH_CONFIG.response_type);
  params.append("scope",AUTH_CONFIG.scope);
  params.append("redirect_uri",AUTH_CONFIG.redirect_uri);
  params.append("state",state);
  params.append("nonce",nonce_hash); 

  const cookies = new Cookies();
  cookies.set('oidc-request-state', state, { path: '/' }); //TODO: Do I need to set other security flags
  cookies.set('oidc-request-nonce', toHexString(nonce), { path: '/' , httpOnly: true}); //HTTPonly prevent access by client-side scripts

  const destinationURL = AUTH_CONFIG.auth_endpoint + "?" + params.toString();
  console.log(destinationURL);
  window.location.replace(destinationURL);
}

function OidcResponseHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const state = searchParams.get("state");
  const code = searchParams.get("code");
  const cookies = new Cookies();

  let initialMsg: string;

  //Validate the state parameter we get back is 
  //what we generated on client side
  if(state === cookies.get("oidc-request-state")) {
    initialMsg = "Waiting to hear back from server..."; //User logged in to OIDC page, but still needs to be logged
                                                        //into our backend system.
  } else {
    initialMsg = "Login Failed. Please try again.";
  }

  const [loginMsg, setLoginMsg] = useState(initialMsg);

  useEffect(() => { //Should be called only once (e.g. upon successful login to OIDC endpoint)
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code })
    };
    fetch(AUTH_CONFIG.login_uri, requestOptions)
    .then(response => response.json())
    .then((data:loginResponse) => { //Get back response from backend server
      console.log(data);
      if(data.success){ 
        //Login was successful! Expect id_token
        setLoginMsg("Login successful!");
        localStorage.setItem(AUTH_CONFIG.id_token_local_storage, data.id_token); //Save id_token to local storage

        const from = location.state?.from?.pathname || "/";
        auth.signin(data.email, ()=>{
          //Redirect user back to their original location
          navigate(from, {replace: true});
        });
      } else {
        //Login was unsuccessful. Let user know about error message.
        setLoginMsg(`Login failed! ${data.error_msg}`);
      }
    });
  },[code,auth]); 

  return (
    <div>
      {loginMsg}
    </div>
  );
}

export { redirectToLogin, OidcResponseHandler};


