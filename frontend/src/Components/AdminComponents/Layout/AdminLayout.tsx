import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { FiUsers, FiSettings, FiHome } from "react-icons/fi";
import { TbFileReport } from "react-icons/tb";
import Sidebar from "../../../Common/Components/Sidebar";

export interface MenuItem {
  title: string;
  key: string;
  path?: string;
  icon?: React.ReactNode;
  subMenu?: string[];
}

export const adminMenu: MenuItem[] = [
  { title: "Dashboard", key: "admin-dashboard", path: "/admin", icon: <FiHome size={20} /> },
  { title: "Users", key: "admin-users", path: "/admin/users", icon: <FiUsers size={20} /> },
  { title: "Reports", key: "admin-reports", path: "/admin/reports", icon: <TbFileReport size={20} /> },
  {
    title: "Settings",
    key: "admin-settings",
    path: "/admin/settings",
    icon: <FiSettings size={20} />,
    subMenu: ["Admin Profile", "Roles", "Permissions"],
  },
];

const AdminLayout: React.FC = () => {
  const [open, setOpen] = useState<boolean>(true);

  return (
    <div className="flex">
        <Sidebar open={open} setOpen={setOpen} menuItems={adminMenu} brand="ADMIN PANEL" />

      <div
        className={`flex-1 transition-all duration-300 ${
          open ? "ml-60" : "ml-20"
        }`}
      >

        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
