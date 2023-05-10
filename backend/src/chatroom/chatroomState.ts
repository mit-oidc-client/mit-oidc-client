import { DisplayedMessageType, MessageType } from "./chatroomType";

// Data structure that stores short history of messages while server is running

let messages: DisplayedMessageType[] = [
  {
    id: 0,
    verifyStatus: 'unverified',
    sender: 'alicebob@mit.edu',
    text: 'this is bad message',
    sig: 'badsig',
    pkToken: 'badpkToken'
}
];
let id_onServer = 1;

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
