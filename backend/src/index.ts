import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const port = process.env.PORT;


// define a route handler for the default home page
app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server');
});

// start the Express server
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});