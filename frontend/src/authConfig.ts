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

export const AUTH_CONFIG: AuthConfig = {
    authority: "https://oidc.mit.edu", 
    auth_endpoint: "https://oidc.mit.edu/authorize",
    client_id: "2cfc993e-45d8-45e3-aaa6-78ef8717cb96", 
    redirect_uri: "https://unofficial-oidc-client.xvm.mit.edu/oidc-response", 
    login: "https://unofficial-oidc-client.xvm.mit.edu/login",
    automaticSilentRenew: true, 
    loadUserInfo: true, 
    silent_redirect_uri: "https://unofficial-oidc-client.xvm.mit.edu/silent-renew", 
    post_logout_redirect_uri: "https://unofficial-oidc-client.xvm.mit.edu/", 
    grantType: "password",
    scope: "openid offline_access", 
    response_type: "code", //mandated by MIT OIDC client
    state_length: 21, //OIDC docs has no requirement on length (though can't be infinite), as long as it's long enough to be unguessable
    nonce_length: 32
};
