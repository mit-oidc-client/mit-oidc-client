interface AuthConfig {

    //OIDC provider-specific configs
    token_endpoint: string, //OIDC provider's token endpoint
    grantType: string;
    scope: string; //The scope being requested from the OIDC provider

    //Client-specific configs 
    client_id: string, //The client application's identifier (as registered with the OIDC provider)
    client_secret: string, //The client application's identifier (as registered with the OIDC provider) - DO NOT EXPOSE PUBLICLY
} 

const OIDC_AUTHORITY_URI = "https://oidc.mit.edu";
const DOMAIN_URI = "https://unofficial-oidc-client.xvm.mit.edu"

export const AUTH_CONFIG: AuthConfig = {

    //OIDC provider-specific configs
    token_endpoint: OIDC_AUTHORITY_URI + "/token",
    grantType: "authorization_code", //manded by MIT OIDC client
    scope: "openid email", //depends on your application needs

    //Client-specific configs 
    client_id: "2cfc993e-45d8-45e3-aaa6-78ef8717cb96", //Safe to save client-side
    client_secret: "FILL_IN_YOURS_HERE",
};
