import React, { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import { DisplayedMessageType, MessageType } from "./chatroomType";
import { useAuth } from "../auth/authProvider";
import { FaCheckCircle, FaExclamation, FaSpinner } from "react-icons/fa";
import { opkService } from "../pktoken";

// API requests
const sendMessage = (
    sender: string,
    text: string,
    sig: string,
    pkToken: string
): Promise<AxiosResponse<MessageType>> => {
    return axios.post<MessageType>("https://unofficial-oidc-client.xvm.mit.edu/api/messages", {
        sender,
        text,
        sig,
        pkToken
    });
};

const getMessages = (id: number): Promise<AxiosResponse<DisplayedMessageType[]>> => {
    return axios.get<DisplayedMessageType[]>(
        "https://unofficial-oidc-client.xvm.mit.edu/api/messages?id=" + id.toString()
    );
};

const signMessage = async (text: string): Promise<string> => {
    const osm = await opkService.generateOSM(text);
    return osm;
};

const getPKToken = (): string => {
    const pkt = opkService.getPKToken();
    return pkt;
};

const ChatRoom = () => {
    const auth = useAuth();
    const [localId, setlocalId] = useState<number>(-1);
    const [verifying, setVerifying] = useState<boolean>(false);
    const [messages, setMessages] = useState<DisplayedMessageType[]>([]);
    const [newMessage, setNewMessage] = useState("");

    useEffect(() => {
        fetchMessages(localId);

        // fetches every 2 seconds
        const intervalId = window.setInterval(() => {
            fetchMessages(localId);
        }, 2000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [localId, verifying]);

    const fetchMessages = (localId: number) => {
        getMessages(localId).then((response) => {
            const newMessages = response.data;
            if (newMessages.length > 0) {
                setMessages((prevMessages) => [...prevMessages, ...newMessages]);
                setlocalId(newMessages[newMessages.length - 1]["id"]);
            }
        });
    };

    // function to add a new message to the messages array
    const handleNewMessage = async (event: React.FormEvent) => {
        event.preventDefault();

        sendMessage(auth.user, newMessage, await signMessage(newMessage), getPKToken()).then(() => {
            setNewMessage("");
            fetchMessages(localId);
        });
    };

    const renderVerifyStatus = (
        id: number,
        verifyStatus: "unverified" | "loading" | "verified" | "failed"
    ) => {
        switch (verifyStatus) {
            case "unverified":
                return (
                    <FaCheckCircle
                        style={{ color: "grey", cursor: "pointer" }}
                        onClick={() => onVerify(id)}
                    />
                );
            case "loading":
                return <FaSpinner />;
            case "verified":
                return <FaCheckCircle style={{ color: "green" }} onClick={() => onVerify(id)} />;
            case "failed":
                return <FaExclamation style={{ color: "red" }} onClick={() => onVerify(id)} />;
            default:
                return <span>something went wrong</span>;
        }
    };

    const onVerify = (id: number) => {
        messages[id].verifyStatus = "loading";
        setVerifying((prevState) => !prevState);
        setTimeout(async () => {
            try {
                const ver = await opkService.verifyOSM(messages[id].sig, messages[id].pkToken);
                messages[id].verifyStatus = ver ? "verified" : "failed";
            } catch {
                messages[id].verifyStatus = "failed";
            }
            setVerifying((prevState) => !prevState);
        }, 1000);
    };

    return (
        <div>
            <div
                style={{
                    height: "400px",
                    width: "600px",
                    overflowY: "scroll",
                    border: "1px solid black"
                }}
            >
                {messages.map((message) => (
                    <div key={message.id} style={{ padding: "2px" }}>
                        <strong style={{ color: message.sender === auth.user ? "blue" : "black" }}>
                            {message.sender}:{" "}
                        </strong>
                        <span style={{ marginRight: "10px" }}>{message.text}</span>
                        {renderVerifyStatus(message.id, message.verifyStatus)}
                    </div>
                ))}
            </div>
            <form onSubmit={handleNewMessage}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    placeholder="Type a message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default ChatRoom;
