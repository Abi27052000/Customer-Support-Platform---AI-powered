import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { FiSettings, FiHome } from "react-icons/fi";
import { TbFileReport } from "react-icons/tb";
import { BiBook } from "react-icons/bi";
import { FaUsers } from "react-icons/fa";
import Sidebar from "../../../Common/Components/Sidebar";
import Navbar from "../../UserComponents/Navbar/Navbar";
import type { MenuItem } from "../../../types/CommonInterface";

export const orgAdminMenu: MenuItem[] = [
    {
        title: "Dashboard",
        key: "oa-dashboard",
        path: "/org-admin",
        icon: <FiHome size={20} />,
    },
    {
        title: "Reference Data",
        key: "oa-ref-data",
        path: "/org-admin/ref-data",
        icon: <BiBook size={20} />,
        subMenu: ["Categories", "Tags", "Templates"],
    },
    {
        title: "Staff Management",
        key: "oa-staff",
        path: "/org-admin/staff",
        icon: <FaUsers size={20} />,
        subMenu: ["All Staff", "Active", "Pending"],
    },
    {
        title: "Reports & Analytics",
        key: "oa-reports",
        path: "/org-admin/reports",
        icon: <TbFileReport size={20} />,
        subMenu: ["Overview", "Performance", "Trends"],
    },
    {
        title: "Settings",
        key: "oa-settings",
        path: "/org-admin/settings",
        icon: <FiSettings size={20} />,
        subMenu: ["Organization Profile", "Roles & Permissions", "Notifications", "Billing"],
    },
];

const OrgAdminLayout: React.FC = () => {
    const [open, setOpen] = useState<boolean>(true);

    return (
        <div className="flex overflow-x-hidden">
            <Sidebar open={open} setOpen={setOpen} menuItems={orgAdminMenu} brand="ORG ADMIN" />

            <div
                className={`flex-1 transition-all duration-300 ${open ? "ml-60" : "ml-20"}`}
            >
                <Navbar />
                <div className="p-8 bg-slate-50 min-h-[calc(100vh-72px)]">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default OrgAdminLayout;
