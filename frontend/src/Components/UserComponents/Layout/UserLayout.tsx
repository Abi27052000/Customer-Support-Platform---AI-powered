import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../../../Common/Components/Sidebar";
import Navbar from "../Navbar/Navbar";
import { useState } from "react";
import { RiChatVoiceLine, RiFeedbackLine } from "react-icons/ri";
import { TbFileReport } from "react-icons/tb";
import { SlEnvolopeLetter } from "react-icons/sl";
import { IoChatboxOutline } from "react-icons/io5";
import {  FiSettings } from "react-icons/fi";
import { FaUsers } from "react-icons/fa";
import { HiOutlineClipboardList } from "react-icons/hi";
import type {MenuItem} from '../../../types/CommonInterface'


export default function UserLayout() {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const isStaffPath = location.pathname.startsWith('/staff');

 const userMenuItems: MenuItem[] = [
  { title: "AI Chat Agent", key: "chat", icon: <IoChatboxOutline size={20} />, path: "/AI-chat" },
  { title: "AI Voice Agent", key: "voice", icon: <RiChatVoiceLine size={20} />, path: "/AI-voice" },
  { title: "AI Summary", key: "summary", icon: <SlEnvolopeLetter size={20} />, path: "/AI-summary" },
  { title: "Reports", key: "reports", icon: <TbFileReport size={20} />, path: "/reports" },
  { title: "Feedback & Complaints", key: "feedback", icon: <RiFeedbackLine size={20} />, path: "/feedback" },
  {
    title: "Setting",
    key: "settings",
    icon: <FiSettings size={20} />,
    path: "/settings",
    subMenu: ["Profile", "Security", "Notifications"],
  },
  // Staff quick link (visible for convenience)
  { title: "Staff", key: "staff", icon: <FaUsers size={18} />, path: "/staff/dashboard" },
];

 const staffMenuItems: MenuItem[] = [
  { title: "Dashboard", key: "s-dashboard", icon: <HiOutlineClipboardList size={20} />, path: "/staff/dashboard" },
  { title: "Conversations", key: "conversations", icon: <IoChatboxOutline size={20} />, path: "/staff/conversations" },
  { title: "Reports", key: "s-reports", icon: <TbFileReport size={20} />, path: "/staff/reports" },
  { title: "Profile", key: "s-profile", icon: <FaUsers size={18} />, path: "/staff/profile" },
  {
    title: "Setting",
    key: "s-settings",
    icon: <FiSettings size={20} />,
    path: "/staff/settings",
    subMenu: ["Profile", "Security", "Notifications"],
  },
];

  return (
    <div className="flex">
      <Sidebar open={open} setOpen={setOpen} menuItems={isStaffPath ? staffMenuItems : userMenuItems} brand={isStaffPath ? "STAFF HUB" : "SUPPORT IQ"}  />

      <div className={`${open ? "ml-60" : "ml-20"} w-full`}>
        <Navbar />
        <div className="pt-10 px-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
