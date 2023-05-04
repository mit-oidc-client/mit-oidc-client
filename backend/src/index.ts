import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';

import { handleLogin } from './auth';

/****************************************************************************************/
import { Server } from 'socket.io';
import { addMessage, getMessages } from './sampleImplementation/ChatroomState';
import { MessageType } from './sampleImplementation/types';
/****************************************************************************************/

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

const io = new Server(server)
// console.log('io', io)

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


// Add an event listener for when a client connects
io.on('connect', (socket) => {
    console.log('Client connected', socket.connected);

    // Add an event listener for when a client sends a new message
    socket.on('newMessage', (message) => {
        console.log('New message:', message);

        // Broadcast the new message to all connected clients
        io.emit('newMessage', message);
    });

    // Add an event listener for when a client disconnects
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});
/****************************************************************************************/


server.listen(port, serverHost, () => {  
    console.log(`⚡️[server]: Server is running at https://${serverHost}:${port}`);
})