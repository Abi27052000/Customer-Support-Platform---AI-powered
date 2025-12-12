import React from "react";
import NotificationIcon from "../Notification/Notification";
import ProfileAvatar from "../../../Pages/UserPages/Profile/Profile";
import { FaBell } from "react-icons/fa";

export default function Navbar() {
  return (
    <div className="w-full h-18 px-12 bg-white shadow-md flex items-center justify-end">
      
      <div className="flex items-center gap-8">
        <h2 className="font-bold text-[#2D2A8C]">WELL COME REMI</h2>
        <NotificationIcon icon={<FaBell />} count={3} />
        <ProfileAvatar src="https://cdn.pixabay.com/photo/2016/11/21/11/17/model-1844729_640.jpg" />
      </div>
    </div>
  );
}

