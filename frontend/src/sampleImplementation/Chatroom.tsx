import React, { useRef, useEffect, useState } from "react";
import axios, { AxiosResponse } from 'axios';
import { MessageType } from './types';
import { useAuth } from "../authProvider";
import io from 'socket.io-client';

// type Props = {
//   messages: MessageType[];
// };

const socket = io('https://unofficial-oidc-client.xvm.mit.edu');

const sendMessage = (id: number, sender: string, text: string, sig: string): Promise<AxiosResponse<MessageType>> => {
  return axios.post<MessageType>('https://unofficial-oidc-client.xvm.mit.edu/api/messages', { id, sender, text, sig });
  // return axios.post<MessageType>('https://localhost:4000', { id, sender, text, sig });
}

const getMessages = (): Promise<AxiosResponse<MessageType[]>> => {
  return axios.get<MessageType[]>('https://unofficial-oidc-client.xvm.mit.edu/api/messages');
  // return axios.get<MessageType[]>('https://localhost:4000');
}

const signMessage = (text: string): string => {
  return text
}


const ChatRoom = () => {
  const chatRoomRef = useRef<HTMLDivElement>(null);
  const auth = useAuth();
    {/* Hard coded messages */}

    const [messages, setMessages] = useState<MessageType[]>([]);
    const [newMessage, setNewMessage] = useState('');

  // Scroll to the bottom of the chat section on mount and whenever new messages are added
  useEffect(() => {
    chatRoomRef.current?.scrollIntoView({ behavior: "smooth" });

    fetchMessages();
    
    return () => {
      socket.off('connect');
    };
  }, []);

  const fetchMessages = () => {
    getMessages().then((response) => {
      setMessages(response.data);
    });
  }

  // Function to add a new message to the messages array
  const handleNewMessage = (event: React.FormEvent) => {
    event.preventDefault();

    // BACKEND SERVER MEMORY
    // Hard coded id
    sendMessage(1, auth.user, newMessage, signMessage(newMessage)).then(() => {
      setNewMessage('');
      fetchMessages();
      socket.emit('newMessage', newMessage);
    })
  };



  return (
    <div>
      <div style={{ height: "400px", width: "600px", overflowY: "scroll" }}>
        {messages.map((message) => (
          <div key={message.id}>
            <strong>{message.sender}: </strong>
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