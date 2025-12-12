import React, { useState } from "react";
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand } from "react-icons/tb";
import SidebarItem from "./SidebarItem";

interface MenuItem {
  title: string;
  key?: string;
  icon?: React.ReactNode;
  path?: string;
  subMenu?: string[];
}

interface SidebarProps {
  open: boolean;
  setOpen: (val: boolean) => void;
  menuItems: MenuItem[];
  brand: string;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen, menuItems, brand }) => {
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);

  const toggleSubMenu = (key: string) => {
    setOpenSubMenu(openSubMenu === key ? null : key);
  };

  return (
    <div
      className={`h-screen bg-[#2D2A8C] text-white flex flex-col p-4 pt-6 
        transition-all duration-300 shadow-xl fixed left-0 top-0
        ${open ? "w-60" : "w-20"}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Logo or Brand text */}
        <h1 className={`text-xl font-semibold transition-all duration-300 overflow-hidden ${open ? "opacity-100 w-auto" : "opacity-0 w-0"}`}
        >
          {brand}
        </h1>

        <button
          onClick={() => setOpen(!open)}
          className="p-2 
           ml-auto rounded-lg bg-white/20 hover:bg-white/30"
        >
          {open ? (
            <TbLayoutSidebarLeftCollapse size={22} />
          ) : (
            <TbLayoutSidebarLeftExpand size={22} />
          )}
        </button>
      </div>

      <ul className="mt-8 space-y-2">
        {menuItems.map((menu) => (
          <SidebarItem
            key={menu.key}
            menu={menu}
            open={open}
            isOpen={openSubMenu === menu.key}
            toggleSubMenu={toggleSubMenu}
          />
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;

