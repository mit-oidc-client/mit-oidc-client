import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';

import { AUTH_CONFIG } from './authConfig';
import { eqSet } from "./authHelper";
import { oidcToken, jwkResponse, loginResponse } from './auth';

// Load in environment variables
dotenv.config();

const https = require("https");
const fs = require("fs");
const  FormData = require('form-data');

const app: Express = express();
const port = process.env.PORT;
const serverHost = process.env.SERVER_HOST; //should be "localhost" (if using reverse proxy) 
                                            //or "0.0.0.0" (listen on all interfaces)

app.use(express.json()); //Use middleware to parse JSON body 
                         //Assumes POST done with Content-Type: application/json

// start the Express server
const server = https
    .createServer(
    {
        key: fs.readFileSync(process.env.SSL_KEY_FILE),
        cert: fs.readFileSync(process.env.SSL_CRT_FILE),
    },
    app
    )
    .listen(port, serverHost, () => {  
        console.log(`⚡️[server]: Server is running at https://${serverHost}:${port}`);
    });

// define a route handler for the default home page
app.get('/api/', (req: Request, res: Response) => {
    res.send('Backend Server');
});

/**
 * Handles login of user following successful authentication to OIDC server
 * 
 * Need JSON post body with parameters:
 * - code: string
 */
app.post('/api/login', async (req: Request, res: Response) => {
    console.log(req.body);
    const code = req.body["code"];
    const userResponse: loginResponse = { //Response we will send back to user
        success: true,
        error_msg: "",
        id_token: ""
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
        userResponse.success = false;
        userResponse.error_msg = "Invalid user code was provided";
        res.status(200).json(userResponse);
        return;
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
        userResponse.success = false;
        userResponse.error_msg = "Please make sure you allow the necessary scopes!";
        res.status(200).json(userResponse);
    }

    //TODO: Check token_type is correct
    //TODO: Store refresh_token (first need to ask for offline_access first)
    //TODO: Store access_token or do something interesting with it

    //Validate ID token and send it back to the user 
    if(oidcJSON.id_token) {

        //Fetch the OIDC server public key
        const oidcPublicKeys = (await axios.get<jwkResponse>(AUTH_CONFIG.public_key)).data;

        if("keys" in oidcPublicKeys && Array.isArray(oidcPublicKeys.keys)) {
            const firstKey = oidcPublicKeys.keys[0]; 
            const pemPublicKey = jwkToPem(firstKey);

            let decoded;
            try {
                //Verify the token, and if valid, return the decoded payload
                decoded = jwt.verify(oidcJSON.id_token,pemPublicKey); 
                //console.log("Decoded",decoded);
        
            } catch(error) {
                //Handle issue with token not having valid signature
                userResponse.success = false;
                userResponse.error_msg = "OIDC error: Invalid signature in OIDC ID token";
                res.status(200).json(userResponse);
            }

            //Proceed to do more checking...
            //e.g., validate all parts of the ID token claims

            //Finally, assured that ID token is valid, send back to user in original JWT form
            userResponse.success = true;
            userResponse.id_token = oidcJSON.id_token;
            res.status(200).json(userResponse);
        }



    }


});

