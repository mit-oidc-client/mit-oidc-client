import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';

// Load in environment variables
dotenv.config();

const https = require("https");
const fs = require("fs");

const app: Express = express();
const port = process.env.PORT;

// start the Express server
const server = https
    .createServer(
    {
        key: fs.readFileSync(process.env.SSL_KEY_FILE),
        cert: fs.readFileSync(process.env.SSL_CRT_FILE),
    },
    app
    )
    .listen(port, () => {
        console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
    });

// define a route handler for the default home page
app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server');
});
