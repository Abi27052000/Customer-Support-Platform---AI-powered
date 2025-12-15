import React, { useMemo, useState } from "react";
import type { RefDataSidebarItemProps } from "./RefDataSidebarItem";
import { RefDataSidebarItem } from "./RefDataSidebarItem";

// 🔹 UPDATED: ADD onSelect PROP
interface RefDataSidebarProps {
  menuItems: RefDataSidebarItemProps[];
  onSelect: (keyName: string, subMenu: string) => void;
}

export const RefDataSidebar: React.FC<RefDataSidebarProps> = ({
  menuItems,
  onSelect, // 🔹 NEW
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const toggleSubMenu = (key: string) => setOpenMenu((prev) => (prev === key ? null : key));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return menuItems;
    return menuItems.filter((it) => {
      const name = (it as any).title || (it as any).name || (it as any).label || it.keyName || "";
      return name.toLowerCase().includes(q);
    });
  }, [menuItems, query]);

  return (
    <aside className="w-72 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-500 flex items-center justify-center text-white font-semibold shadow-md">
          RD
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold leading-5">Reference Data</h3>

        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 13.65z" />
          </svg>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search menus..."
          className="w-full pl-10 pr-3 py-2 text-sm rounded-full bg-gray-100 dark:bg-gray-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
        />
      </div>

      {/* Menu list - scrollable */}
      <div className="mt-3 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {filtered.length === 0 && (
            <li className="py-3 px-3 text-xs text-gray-500">No matching menus</li>
          )}

          {filtered.map((item) => (
            <li key={item.keyName} className="group">
              <RefDataSidebarItem
                {...item}
                isOpen={openMenu === item.keyName}
                toggleSubMenu={toggleSubMenu}
                onSelect={onSelect}
              />
            </li>
          ))}
        </ul>
      </div>

    </aside>
  );
};
