// Data structure that stores short history of messages while server is running

import { DisplayedMessageType, MessageType } from "./types";

let messages: DisplayedMessageType[] = [];
let id_onServer = 0;

export const addMessage = (sender: string, text: string, sig: string, pkToken: string): void => {
    const message: MessageType = {
        sender,
        text,
        sig,
        pkToken
    };
    messages.push({ ...message, id: id_onServer, verifyStatus: "unverified" });
    id_onServer += 1;
};

export const getMessages = (id: number): DisplayedMessageType[] => {
    return messages.filter((message) => message.id > id);
};
