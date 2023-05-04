import React, { useRef, useEffect, useState } from "react";
import axios, { AxiosResponse } from 'axios';
import { MessageType } from './types';
import { useAuth } from "../authProvider";

// API requests
const sendMessage = (id: number, sender: string, text: string, sig: string): Promise<AxiosResponse<MessageType>> => {
  return axios.post<MessageType>('https://unofficial-oidc-client.xvm.mit.edu/api/messages', { id, sender, text, sig });
}

const getMessages = (): Promise<AxiosResponse<MessageType[]>> => {
  return axios.get<MessageType[]>('https://unofficial-oidc-client.xvm.mit.edu/api/messages');
}

// TODO: Signing function
const signMessage = (text: string): string => {
  return text
}

const ChatRoom = () => {
  const chatRoomRef = useRef<HTMLDivElement>(null);
  const auth = useAuth();

  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // scroll to the bottom of the chat section on mount
  useEffect(() => {
    chatRoomRef.current?.scrollIntoView({ behavior: "smooth" });
    fetchMessages();

    // fetches every 2 seconds
    const intervalId = window.setInterval(() => {
      fetchMessages();
    }, 2000);
    
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const fetchMessages = () => {
    getMessages().then((response) => {
      setMessages(response.data);
    });
  }

  // function to add a new message to the messages array
  const handleNewMessage = (event: React.FormEvent) => {
    event.preventDefault();

    // Hard coded id
    // TODO: fill in arguments
    sendMessage(1, auth.user, newMessage, signMessage(newMessage)).then(() => {
      setNewMessage('');
      fetchMessages();
    })
  };

  return (
    <div>
      <div style={{ height: "400px", width: "600px", overflowY: "scroll", border: '1px solid black' }}>
        {messages.map((message) => (
          <div key={message.id} style={{ padding: "2px" }}>
            <strong style={{color: message.sender === auth.user ? 'blue' : 'black'}}>{message.sender}: </strong>
            <span>{message.text}</span>
            {/* <span>{message.sig}</span> */}
          </div>
        ))}
        <div ref={chatRoomRef} />
      </div>
      <form onSubmit={handleNewMessage}>
        <input type="text" value={newMessage} onChange={(event) => setNewMessage(event.target.value)} placeholder="Type a message..." />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatRoom;