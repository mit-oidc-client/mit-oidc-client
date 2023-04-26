interface AuthConfig {
    authority: string, //The URL of the OIDC provider.
    auth_endpoint: string, //URL of the authentication endpoint
    client_id: string, //The client application's identifier as registered with the OIDC provider.
    redirect_uri: string, ///The URI of the client application that is set to receive a response from the OIDC provider.
    login: string, //Endpoint for client application to handle logins
    automaticSilentRenew: boolean; //Flag to indicate if there should be an automatic attempt to renew the access token prior to its expiration.
    loadUserInfo: boolean; //Flag to control if additional identity data is loaded from the user info endpoint in order to populate the user's profile.
    silent_redirect_uri: string; //The URL for the page containing the code handling the silent renew.
    post_logout_redirect_uri: string; //The URI for OIDC post-logout redirect
    grantType: string; 
    scope: string; //The scope being requested from the OIDC provider.
    response_type: string;
    state_length: number; //The byte length of `state` variable to be sent as part of login request
    nonce_length: number; //The byte length of `state` variable to be generated as part of login flow
} 

const OIDC_AUTHORITY_URI = "https://oidc.mit.edu";
const DOMAIN_URI = "https://unofficial-oidc-client.xvm.mit.edu"

export const AUTH_CONFIG: AuthConfig = {
    authority: OIDC_AUTHORITY_URI, 
    auth_endpoint: OIDC_AUTHORITY_URI + "/authorize",
    client_id: "2cfc993e-45d8-45e3-aaa6-78ef8717cb96", 
    redirect_uri: DOMAIN_URI + "/oidc-response", 
    login: DOMAIN_URI + "/login",
    automaticSilentRenew: true, 
    loadUserInfo: true, 
    silent_redirect_uri: DOMAIN_URI + "/silent-renew", 
    post_logout_redirect_uri: DOMAIN_URI, 
    grantType: "authorization_code",
    scope: "openid email", //depends on your application needs
    response_type: "code", //mandated by MIT OIDC client
    state_length: 32, //OIDC docs has no requirement on length (though can't be infinite), as long as it's long enough to be unguessable
    nonce_length: 32
};
