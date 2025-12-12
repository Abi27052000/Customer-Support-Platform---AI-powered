import { Outlet } from "react-router-dom";
import Sidebar from "../../../Common/Components/Sidebar";
import Navbar from "../Navbar/Navbar";
import { useState } from "react";
import { RiChatVoiceLine, RiFeedbackLine } from "react-icons/ri";
import { TbFileReport } from "react-icons/tb";
import { SlEnvolopeLetter } from "react-icons/sl";
import { IoChatboxOutline } from "react-icons/io5";
import {  FiSettings } from "react-icons/fi";

interface MenuItem {
  title: string;
  key?: string;
  icon?: React.ReactNode;
  path?: string;
  subMenu?: string[];
}


export default function UserLayout() {
  const [open, setOpen] = useState(true);

 const menuItems: MenuItem[] = [
  { title: "AI Chat Agent", key: "chat", icon: <IoChatboxOutline size={20} />, path: "/" },
  { title: "AI Voice Agent", key: "voice", icon: <RiChatVoiceLine size={20} />, path: "/restaurants" },
  { title: "AI Summary", key: "summary", icon: <SlEnvolopeLetter size={20} />, path: "/orders" },
  { title: "Reports", key: "reports", icon: <TbFileReport size={20} />, path: "/reports" },
  { title: "Feedback & Complaints", key: "feedback", icon: <RiFeedbackLine size={20} />, path: "/feedback" },
  {
    title: "Setting",
    key: "settings",
    icon: <FiSettings size={20} />,
    path: "/settings",
    subMenu: ["Profile", "Security", "Notifications"],
  },
];

  return (
    <div className="flex">
      <Sidebar open={open} setOpen={setOpen} menuItems={menuItems} brand="SUPPORT IQ"  />

      <div className={`${open ? "ml-60" : "ml-20"} w-full`}>
        <Navbar />
        <div className="pt-10 px-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
