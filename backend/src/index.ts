import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { handleLogin } from "./auth/auth";

/****************************************************************************************/
import { addMessage, getMessages } from "./chatroom/chatroomState";
import { DisplayedMessageType, MessageType } from "./chatroom/chatroomType";
/****************************************************************************************/

// Load in environment variables
dotenv.config();

const https = require("https");
const fs = require("fs");
const FormData = require("form-data");
const cookieParser = require("cookie-parser");

const app: Express = express();
const port = process.env.PORT;
const serverHost = process.env.SERVER_HOST; //should be "localhost" (if using reverse proxy)
//or "0.0.0.0" (listen on all interfaces)

app.use(express.json()); //Use middleware to parse JSON body
//Assumes POST done with Content-Type: application/json
app.use(cookieParser()); //Use middleware to parse cookies

// start the Express server
const server = https.createServer(
    {
        key: fs.readFileSync(process.env.SSL_KEY_FILE),
        cert: fs.readFileSync(process.env.SSL_CRT_FILE)
    },
    app
);

// define a route handler for the default home page
app.get("/api/", (req: Request, res: Response) => {
    res.send("Backend Server");
});

/**
 * Handles login of user following successful authentication to OIDC server
 *
 * Need JSON post body with parameters:
 * - code: string
 */
app.post("/api/login", handleLogin);

/****************************************************************************************/
/** sample implementation: Chatroom */

// Handle POST requests to /api/messages
app.post("/api/messages", (req: Request<MessageType>, res: Response) => {
    const {
        sender,
        text,
        sig,
        pkToken
    }: { sender: string; text: string; sig: string; pkToken: string } = req.body;
    addMessage(sender, text, sig, pkToken);
    res.sendStatus(200);
});

// Handle GET requests to /api/messages?id={id}
app.get("/api/messages", (req: Request, res: Response<DisplayedMessageType[]>) => {
    const id = Number(req.query.id);
    const messages: DisplayedMessageType[] = getMessages(id);
    res.json(messages);
});
/****************************************************************************************/

server.listen(port, serverHost, () => {
    console.log(`⚡️[server]: Server is running at https://${serverHost}:${port}`);
});
