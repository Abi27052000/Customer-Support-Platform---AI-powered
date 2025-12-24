import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import {  FiSettings, FiHome } from "react-icons/fi";
import { BiBook } from "react-icons/bi";
import { VscOrganization } from "react-icons/vsc";
import Sidebar from "../../../Common/Components/Sidebar";
import type {MenuItem}  from '../../../types/CommonInterface'

export const orgadminMenu: MenuItem[] = [
  { title: "Reference Data", key: "ref-data", path: "/org-admin/ref-data", icon: <BiBook size={20} /> },
  {
    title: "Settings",
    key: "admin-settings",
    path: "/org-admin/settings",
    icon: <FiSettings size={20} />,
    subMenu: ["Admin Profile", "Roles", "Permissions"],
  },
];

export const OrgAdminLayout: React.FC = () => {
  const [open, setOpen] = useState<boolean>(true);

  return (
    <div className="flex">
      <Sidebar open={open} setOpen={setOpen} menuItems={orgadminMenu} brand="ADMIN PANEL" />

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


