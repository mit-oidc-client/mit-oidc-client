import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { AUTH_CONFIG } from './authConfig';

// Load in environment variables
dotenv.config();

const https = require("https");
const fs = require("fs");

const app: Express = express();
const port = process.env.PORT;

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
    .listen(port, '0.0.0.0', () => {
        console.log(`⚡️[server]: Server is running at https://0.0.0.0:${port}`);
    });

// define a route handler for the default home page
app.get('/api/', (req: Request, res: Response) => {
    res.send('Backend Server');
});

app.post('/api/login', (req: Request, res: Response) => {
    res.send(req.body);
});

