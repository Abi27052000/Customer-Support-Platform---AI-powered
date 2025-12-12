import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { FiUsers, FiSettings, FiHome } from "react-icons/fi";
import { TbFileReport } from "react-icons/tb";
import { BiBook } from "react-icons/bi";
import { VscOrganization } from "react-icons/vsc";
import Sidebar from "../../../Common/Components/Sidebar";

export interface MenuItem {
  title: string;
  key: string;
  path?: string;
  icon?: React.ReactNode;
  subMenu?: string[];
}

export const adminMenu: MenuItem[] = [
  { title: "Reference Data", key: "ref-data", path: "/admin/ref-data", icon: <BiBook size={20} /> },
  { title: "Organization SignUp", key: "org-register", path: "/admin/org-register", icon: < VscOrganization size={20} /> },
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
        className={`flex-1 transition-all duration-300 ${open ? "ml-60" : "ml-20"
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
