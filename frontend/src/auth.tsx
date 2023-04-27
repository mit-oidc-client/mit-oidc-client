import { AUTH_CONFIG } from "./authConfig";
import { generateRandomBytes, toHexString} from "./authHelper";
import Cookies from 'universal-cookie';
import { useSearchParams } from 'react-router-dom';

async function redirectToLogin() { //Redirect user to OIDC Authentication Endpoint with necessary query parameters

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

const oidcAuthProvider = {
  isAuthenticated: false,
  signin(callback: VoidFunction) {
    oidcAuthProvider.isAuthenticated = true;
    setTimeout(callback, 100); // fake async
  },
  signout(callback: VoidFunction) {
    oidcAuthProvider.isAuthenticated = false;
    setTimeout(callback, 100);
  },
};

function OidcResponseHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  let authResult;
  const cookies = new Cookies();

  //Validate the state parameter we get back is 
  //what we generated on client side
  if(state === cookies.get("oidc-request-state")) {
    authResult = <h3> Login Successful!</h3>
  } else {
    authResult = <h3> Login Failed. Please try again.</h3>
  }

  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code })
  };
  fetch(AUTH_CONFIG.login_uri, requestOptions)
  //.then(response => response.json())
  //.then(data => this.setState({ postId: data.id }));

  return (
    <div>
      {authResult}
    </div>
  );
}

export { oidcAuthProvider, redirectToLogin, OidcResponseHandler};


