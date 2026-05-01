import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { FiSettings } from "react-icons/fi";
import { BiBook } from "react-icons/bi";
import { VscOrganization } from "react-icons/vsc";
import Sidebar from "../../../Common/Components/Sidebar";
import Navbar from "../../UserComponents/Navbar/Navbar";
import type { MenuItem } from '../../../types/CommonInterface'

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
    <div className="flex overflow-x-hidden">
      <Sidebar open={open} setOpen={setOpen} menuItems={adminMenu} brand="ADMIN PANEL" />

      <div
        className={`flex-1 transition-all duration-300 ${open ? "ml-60" : "ml-20"
          }`}
      >
        <Navbar />
        <div className="p-8 bg-slate-50 min-h-[calc(100vh-72px)]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
