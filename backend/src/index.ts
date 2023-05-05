import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';

import { handleLogin } from './auth';

/****************************************************************************************/
import { addMessage, getMessages } from './chatroom/ChatroomState';
import { MessageType } from './chatroom/types';
/****************************************************************************************/

// Load in environment variables
dotenv.config();

const https = require("https");
const fs = require("fs");
const  FormData = require('form-data');
const cookieParser = require("cookie-parser");


const app: Express = express();
const port = process.env.PORT;
const serverHost = process.env.SERVER_HOST; //should be "localhost" (if using reverse proxy) 
                                            //or "0.0.0.0" (listen on all interfaces)

app.use(express.json()); //Use middleware to parse JSON body 
                         //Assumes POST done with Content-Type: application/json
app.use(cookieParser()); //Use middleware to parse cookies

// start the Express server
const server = https
    .createServer(
    {
        key: fs.readFileSync(process.env.SSL_KEY_FILE),
        cert: fs.readFileSync(process.env.SSL_CRT_FILE),
    }, app);

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
app.post('/api/login', handleLogin);


/****************************************************************************************/
/** sample implementation: Chatroom */

// route to add a new chat message
app.post('/api/messages', (req: Request, res: Response) => {
    const { id, sender, text, sig}: { id: number, sender: string, text: string, sig: string } = req.body;
    addMessage(id, sender, text, sig);
    res.sendStatus(200);
});

// route to get the chat history
app.get('/api/messages', (req: Request, res: Response<MessageType[]>) => {
    const messages: MessageType[] = getMessages();
    res.json(messages);
});
/****************************************************************************************/


server.listen(port, serverHost, () => {  
    console.log(`⚡️[server]: Server is running at https://${serverHost}:${port}`);
})