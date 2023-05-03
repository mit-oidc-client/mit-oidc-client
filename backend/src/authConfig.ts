const fs = require('fs');

const secretsData = fs.readFileSync('../cert/secrets.json'); //We choose to read in the client_secret 
                                                             //from a JSON file stored in /cert folder
                                                             
const secrets = JSON.parse(secretsData); //Contain OIDC registration info

interface AuthConfig {

    //OIDC provider-specific configs
    token_endpoint: string, //OIDC provider's token endpoint
    user_info_endpoint: string, //OIDC provider's user information endpoint
    public_key: string, //OIDC provider's URI containing public key in JWK format
    grantType: string; 
    tokenType: string; 
    tokenIssuer: string, //Listed issuer in valid ID tokens


    //Client-specific configs 
    redirect_uri: string, ///Endpoint to receive authorization response 
    client_id: string, //The client application's identifier (as registered with the OIDC provider)
    client_secret: string, //The client application's identifier (as registered with the OIDC provider) - DO NOT EXPOSE PUBLICLY
    scope: string; //The scope being requested from the OIDC provider
} 

const OIDC_AUTHORITY_URI = "https://oidc.mit.edu";
const DOMAIN_URI = "https://unofficial-oidc-client.xvm.mit.edu"

export const AUTH_CONFIG: AuthConfig = {

    //OIDC provider-specific configs
    token_endpoint: OIDC_AUTHORITY_URI + "/token",
    user_info_endpoint: OIDC_AUTHORITY_URI + "/userinfo",
    public_key: OIDC_AUTHORITY_URI + "/jwk",
    grantType: "authorization_code", //mandated by MIT OIDC client
    tokenType: "Bearer", //mandated by MIT OIDC client
    tokenIssuer: OIDC_AUTHORITY_URI,

    //Client-specific configs 
    redirect_uri: DOMAIN_URI + "/oidc-response", 
    client_id: "2cfc993e-45d8-45e3-aaa6-78ef8717cb96", //Safe to save client-side
    client_secret: secrets["client_secret"], 
    scope: "openid email", //depends on your application needs

};
