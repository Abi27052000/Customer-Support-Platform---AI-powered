import React from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

export interface RefDataSidebarItemProps {
  title: string;
  keyName: string;
  subMenu?: string[];
  isOpen?: boolean;
  toggleSubMenu?: (key: string) => void;
}

export const RefDataSidebarItem: React.FC<RefDataSidebarItemProps> = ({ title, subMenu, isOpen, toggleSubMenu, keyName }) => {
  return (
    <li className="flex flex-col text-black group relative">
      <div
        onClick={() => toggleSubMenu?.(keyName)}
        className="flex items-center justify-between py-2 px-3 rounded cursor-pointer hover:bg-white/20 transition-all"
      >
        <span>{title}</span>
        {subMenu && <span>{isOpen ? <FaChevronDown /> : <FaChevronRight />}</span>}
      </div>

      {subMenu && isOpen && (
        <ul className="pl-6 mt-1 space-y-1">
          {subMenu.map((sub) => (
            <li key={sub} className="py-1 px-3 rounded hover:bg-white/10 cursor-pointer text-sm">
              {sub}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

