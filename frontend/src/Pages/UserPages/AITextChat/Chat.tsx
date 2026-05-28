
import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import { Socket } from "socket.io-client";
import "./AITextPage.css";

interface Message {
  room: string;
  author: string;
  message: string;
  time: string;
}

interface ChatProps {
  socket: Socket;
  username: string;
  room: string;
}

const Chat: React.FC<ChatProps> = ({ socket, username, room }) => {
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [messageList, setMessageList] = useState<Message[]>([]);

  const sendMessage = () => {
    if (!currentMessage.trim() || !room) return;

    const messageData: Message = {
      room,
      author: username,
      message: currentMessage,
      time: new Date().toLocaleTimeString(),
    };

    socket.emit("send_message", messageData);
    setCurrentMessage("");
  };

  // Receive messages from server
  useEffect(() => {
    const handleReceive = (data: Message) => {
      setMessageList((list) => [...list, data]);
    };

    socket.on("receive_message", handleReceive);

    return () => {
      socket.off("receive_message", handleReceive);
    };
  }, [socket]);

  return (
    <div className="ai-chat-page">
      <div className="chat-window">
        <div className="chat-header">
          Live Chat - Room: {room}
        </div>

        <div className="chat-body">
          <ScrollToBottom className="message-container">
            <div className="messages">
              {messageList.map((msg, idx) => {
                let messageId = "other";
                if (msg.author === username) messageId = "you";
                if (msg.author === "AI-Bot") messageId = "ai";

                return (
                  <div className={`message ${messageId}`} key={idx} id={messageId}>
                    <div className="message-content">{msg.message}</div>
                    <div className="message-meta">
                      <span>{msg.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollToBottom>
        </div>

        <div className="chat-footer">
          <input
            type="text"
            value={currentMessage}
            placeholder="Type a message..."
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>&#9658;</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
