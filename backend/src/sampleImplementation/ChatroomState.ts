import { MessageType } from './types';


let messages: MessageType[] = [];
const MAX_LENGTH = 10

export const addMessage = (id: number, sender: string, text: string, sig: string): void => {
  const message: MessageType = { 
    id,
    sender, 
    text,
    sig,
  };
  messages.push(message);
  if (messages.length > MAX_LENGTH) {
    messages = messages.slice(1)
  }
};

export const getMessages = (): MessageType[] => {
  return messages;
};