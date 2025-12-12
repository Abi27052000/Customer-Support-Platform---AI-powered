import React from "react";
import { NavLink } from "react-router-dom";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import type { MenuItem } from "../../types/CommonInterface";

interface SidebarItemProps {
  menu: MenuItem;
  open: boolean;
  isOpen: boolean;
  toggleSubMenu: (key: string) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ menu, open, isOpen, toggleSubMenu }) => {
  const handleClick = () => {
    if (menu.subMenu) {
      toggleSubMenu(menu.key);
    }
  };

  return (
    <li className="flex flex-col text-white group relative">
      {/* If menu has path → Use NavLink */}
      {menu.path ? (
        <NavLink
          to={menu.path}
          className={({ isActive }) =>
            `flex items-center justify-between py-2 px-3 rounded cursor-pointer transition-all 
            ${isActive ? "bg-white/30" : "hover:bg-white/20"}`
          }
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{menu.icon}</span>
            {open && <span className="text-sm">{menu.title}</span>}
          </div>

        </NavLink>
      ) : (
        /* If menu has submenu → Normal button */
        <div
          onClick={handleClick}
          className="flex items-center justify-between py-2 px-3 rounded cursor-pointer 
          hover:bg-white/20 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{menu.icon}</span>
            {open && <span className="text-sm">{menu.title}</span>}
          </div>

          {menu.subMenu && open && (
            <span>{isOpen ? <FaChevronDown /> : <FaChevronRight />}</span>
          )}
        </div>
      )}

      {/* Tooltip when collapsed */}
      {!open && (
        <span
          className="absolute left-[4.5rem] top-2 bg-[#2D2A8C] px-3 py-1 
          text-xs rounded opacity-0 group-hover:opacity-100 z-50 whitespace-nowrap"
        >
          {menu.title}
        </span>
      )}

      {/* Submenu */}
      {menu.subMenu && isOpen && open && (
        <ul className="pl-10 mt-1 space-y-1">
          {menu.subMenu.map((sub: string, i: number) => (
            <li
              key={i}
              className="py-1 px-3 rounded hover:bg-white/10 cursor-pointer text-sm"
            >
              {sub}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

export default SidebarItem;
