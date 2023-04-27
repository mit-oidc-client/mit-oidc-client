import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { AUTH_CONFIG } from './authConfig';

// Load in environment variables
dotenv.config();

const https = require("https");
const fs = require("fs");

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

app.post('/api/login', (req: Request, res: Response) => {
    res.send(req.body);
});

