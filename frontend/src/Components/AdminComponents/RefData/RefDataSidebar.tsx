import React, { useState } from "react";
import type { RefDataSidebarItemProps } from "./RefDataSidebarItem";
import { RefDataSidebarItem } from "./RefDataSidebarItem";


interface RefDataSidebarProps {
  menuItems: RefDataSidebarItemProps[];
}

export const RefDataSidebar: React.FC<RefDataSidebarProps> = ({ menuItems }) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const toggleSubMenu = (key: string) =>
    setOpenMenu(openMenu === key ? null : key);

  return (
    <div
      className="
       bg-white shadow-xl
        text-black
        w-64
        p-4
        flex
        flex-col
        rounded-xl
      "
    >
      <h2 className="text-lg font-semibold mb-3">Reference Data</h2>

      <ul className="space-y-1 text-black">
        {menuItems.map((item) => (
          <RefDataSidebarItem
            key={item.keyName}
            {...item}
            isOpen={openMenu === item.keyName}
            toggleSubMenu={toggleSubMenu}
          />
        ))}
      </ul>
    </div>
  );
};
