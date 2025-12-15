import React, { useState } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

export interface RefDataSidebarItemProps {
  title: string;
  keyName: string;
  subMenu?: string[];
  isOpen?: boolean;
  toggleSubMenu?: (key: string) => void;

  // 🔹 NEW: ADD onSelect
  onSelect?: (keyName: string, subMenu: string) => void;
}

export const RefDataSidebarItem: React.FC<RefDataSidebarItemProps> = ({
  title,
  subMenu,
  isOpen,
  toggleSubMenu,
  keyName,
  onSelect, // 🔹 NEW
}) => {
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  const handleMainClick = () => {
    // toggle submenu visibility
    toggleSubMenu?.(keyName);
    // default select first submenu (usually 'All') to give immediate feedback
    const defaultSub = subMenu?.[0] ?? "All";
    onSelect?.(keyName, defaultSub);
    setSelectedSub(defaultSub);
  };

  const handleSubClick = (sub: string) => {
    onSelect?.(keyName, sub);
    setSelectedSub(sub);
  };

  const onKeyDownMain = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleMainClick();
    }
  };

  return (
    <li className="flex flex-col text-gray-800 dark:text-gray-200 group relative">
      {/* MAIN MENU */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={onKeyDownMain}
        onClick={handleMainClick}
        className="flex items-center justify-between py-2 px-3 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
      >
        <span className="font-medium">{title}</span>
        {subMenu && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isOpen ? <FaChevronDown /> : <FaChevronRight />}
          </span>
        )}
      </div>

      {/* SUB MENU */}
      {subMenu && isOpen && (
        <ul className="pl-6 mt-2 space-y-1">
          {subMenu.map((sub) => {
            const active = selectedSub === sub;
            return (
              <li
                key={sub}
                className={`py-1 px-3 rounded-md text-sm cursor-pointer transition-colors duration-150 ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                }`}
                onClick={() => handleSubClick(sub)}
              >
                {sub}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
};
