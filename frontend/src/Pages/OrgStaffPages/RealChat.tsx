import React, { useEffect, useState } from "react";
import Chat from "../UserPages/AITextChat/Chat";
import { socket } from "../UserPages/AITextChat/socket";
import "../UserPages/AITextChat/AITextPage.css";
import { useAuth } from "../../Context/AuthContext";

const RealChat: React.FC = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [staffId, setStaffId] = useState("");

  useEffect(() => {
    const loadStaff = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("/api/staff/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setStaffId(data.staff?.id || "");
        localStorage.setItem("staffId", data.staff?.id || "");
      } catch (error) {
        console.error("Failed to load staff profile", error);
      }
    };

    void loadStaff();
  }, []);

  const joinRoom = () => {
    if (username.trim() !== "" && room.trim() !== "") {
      socket.emit("join_room", {
        roomId: room,
        orgId: user?.orgId,
        staffId,
        role: "staff",
      });
      setShowChat(true);
    }
  };

  return (
    <div className="App">
      {!showChat ? (
        <div className="joinChatContainer">
          <h3>Join A Chat</h3>
          <input
            type="text"
            placeholder="Your name..."
            onChange={(event) => setUsername(event.target.value)}
          />
          <input
            type="text"
            placeholder="Room ID..."
            onChange={(event) => setRoom(event.target.value)}
          />
          <button onClick={joinRoom}>Join A Room</button>
        </div>
      ) : (
        <Chat socket={socket} username={username} room={room} role="staff" orgId={user?.orgId} staffId={staffId} />
      )}
    </div>
  );
};

export default RealChat;
