import React, { useEffect, useState } from "react";
import { RefDataSidebar } from "../../../Components/AdminComponents/RefData/RefDataSidebar";
import { RefDataTable } from "../../../Components/AdminComponents/RefData/RefDataTable";
import { RightActionBar } from "../../../Components/AdminComponents/RefData/RightActionBar";
import EditPanel from "../../../Components/AdminComponents/RefData/EditPanel";

import type { ReferenceDataRow } from "../../../Components/AdminComponents/RefData/RefDataTable";
import type { RefDataSidebarItemProps } from "../../../Components/AdminComponents/RefData/RefDataSidebarItem";
import { FaHome, FaArrowLeft } from "react-icons/fa";

// 🔹 MENU CONFIG
const menuItems: RefDataSidebarItemProps[] = [
  { title: "Units", keyName: "units", subMenu: ["All", "Active", "Inactive"] },
  { title: "Users", keyName: "users", subMenu: ["All", "Active", "Pending"] },
  { title: "Roles", keyName: "roles", subMenu: ["All", "Admin", "User"] },
];

// 🔹 DATA MAP (UNCHANGED)
const refDataMap: Record<string, ReferenceDataRow[]> = {
  units_all: [
    { id: "1", name: "Sales Department", status: "Active" },
    { id: "2", name: "Human Resources", status: "Active" },
    { id: "3", name: "IT Department", status: "Active" },
    { id: "4", name: "Finance", status: "Active" },
    { id: "5", name: "Marketing", status: "Active" },
    { id: "6", name: "Research & Development", status: "Active" },
    { id: "7", name: "Customer Support", status: "Active" },
    { id: "8", name: "Operations", status: "Active" },
    { id: "9", name: "Legal Department", status: "Active" },
    { id: "10", name: "Quality Assurance", status: "Active" }
  ],

  units_active: [
    { id: "1", name: "Sales Department", status: "Active" },
    { id: "2", name: "Human Resources", status: "Active" },
    { id: "3", name: "IT Department", status: "Active" },
    { id: "4", name: "Finance", status: "Active" },
    { id: "5", name: "Marketing", status: "Active" }
  ],

  units_inactive: [
    { id: "6", name: "Research & Development", status: "Inactive" },
    { id: "7", name: "Customer Support", status: "Inactive" },
    { id: "8", name: "Operations", status: "Inactive" },
    { id: "9", name: "Legal Department", status: "Inactive" },
    { id: "10", name: "Quality Assurance", status: "Inactive" }
  ],

  users_all: [
    { id: "1", name: "John Smith", status: "Active" },
    { id: "2", name: "Mary Johnson", status: "Active" },
    { id: "3", name: "Robert Chen", status: "Active" },
    { id: "4", name: "Sarah Williams", status: "Active" },
    { id: "5", name: "David Lee", status: "Active" },
    { id: "6", name: "Emma Wilson", status: "Pending" },
    { id: "7", name: "Michael Brown", status: "Pending" },
    { id: "8", name: "Lisa Garcia", status: "On Leave" },
    { id: "9", name: "James Taylor", status: "Inactive" },
    { id: "10", name: "Anna Martinez", status: "Active" }
  ],

  users_active: [
    { id: "1", name: "John Smith", status: "Active" },
    { id: "2", name: "Mary Johnson", status: "Active" },
    { id: "3", name: "Robert Chen", status: "Active" },
    { id: "4", name: "Sarah Williams", status: "Active" },
    { id: "5", name: "David Lee", status: "Active" }
  ],

  users_pending: [
    { id: "6", name: "Emma Wilson", status: "Pending" },
    { id: "7", name: "Michael Brown", status: "Pending" },
    { id: "8", name: "Lisa Garcia", status: "Pending" },
    { id: "9", name: "James Taylor", status: "Pending" },
    { id: "10", name: "Anna Martinez", status: "Pending" }
  ],

  roles_all: [
    { id: "1", name: "Administrator", status: "Active" },
    { id: "2", name: "Manager", status: "Active" },
    { id: "3", name: "Team Lead", status: "Active" },
    { id: "4", name: "Senior Developer", status: "Active" },
    { id: "5", name: "Junior Developer", status: "Active" },
    { id: "6", name: "HR Specialist", status: "Active" },
    { id: "7", name: "Accountant", status: "Active" },
    { id: "8", name: "Marketing Analyst", status: "Active" },
    { id: "9", name: "Support Agent", status: "Active" },
    { id: "10", name: "QA Engineer", status: "Active" }
  ],

  roles_admin: [
    { id: "1", name: "System Administrator", status: "Active" },
    { id: "2", name: "Database Administrator", status: "Active" },
    { id: "3", name: "Network Administrator", status: "Active" },
    { id: "4", name: "Security Administrator", status: "Active" },
    { id: "5", name: "Application Administrator", status: "Active" }
  ],

  roles_user: [
    { id: "6", name: "Regular User", status: "Active" },
    { id: "7", name: "Guest User", status: "Active" },
    { id: "8", name: "External User", status: "Active" },
    { id: "9", name: "Temporary User", status: "Active" },
    { id: "10", name: "Read-Only User", status: "Active" }
  ],
};


export const ReferenceDataPage: React.FC = () => {
  // 🔹 SELECTED KEY + MENU
  const [selectedKey, setSelectedKey] = useState<string>("units_all");
  const [selectedMenuTitle, setSelectedMenuTitle] = useState<string>("Units");
  const [selectedSubMenu, setSelectedSubMenu] = useState<string>("All");

  const [selectedRow, setSelectedRow] = useState<ReferenceDataRow | null>(null);
  const [editItem, setEditItem] = useState<ReferenceDataRow | null>(null);

  const FIRST_MENU = menuItems[0];
  const FIRST_SUB = FIRST_MENU.subMenu?.[0] ?? "All";

  // 🔹 AUTO SELECT FIRST ROW
  useEffect(() => {
    const currentData = refDataMap[selectedKey];
    setSelectedRow(currentData?.[0] ?? null);
  }, [selectedKey]);

  // 🔹 NAVIGATION FUNCTIONS
  const goHome = () => {
    const key = `${FIRST_MENU.keyName}_${FIRST_SUB.toLowerCase()}`;
    setSelectedKey(key);
    setSelectedMenuTitle(FIRST_MENU.title);
    setSelectedSubMenu(FIRST_SUB);
  };

  const goBack = () => {
    const currentMenu = selectedKey.split("_")[0];
    if (selectedSubMenu === FIRST_SUB) {
      goHome();
      return;
    }
    const parentSub = FIRST_SUB; // default to first submenu
    setSelectedKey(`${currentMenu}_${parentSub.toLowerCase()}`);
    setSelectedSubMenu(parentSub);
  };

  return (
      <div className="flex relative">
        <RefDataSidebar
            menuItems={menuItems}
            onSelect={(keyName, subMenu) => {
              const key = `${keyName}_${subMenu.toLowerCase()}`;
              setSelectedKey(key);

              const menuTitle =
                  menuItems.find((item) => item.keyName === keyName)?.title ?? "";

              setSelectedMenuTitle(menuTitle);
              setSelectedSubMenu(subMenu);

              setEditItem(null);
            }}
            selectedKeyName={selectedKey.split("_")[0]} // 🔹 pass for sidebar highlight
            selectedSubMenu={selectedSubMenu} // 🔹 pass for sidebar highlight
        />


        <div className="w-[900px] max-w-[900px] p-6 pr-24">
          {/* 🔹 UPDATED HEADER WITH ICONS */}
          <h1 className="text-2xl font-bold mb-2">Reference Data</h1>
          <div className="flex items-center gap-3 mb-4">

            <button
                onClick={goHome}
                className="p-2 rounded-full hover:bg-gray-200 transition"
                title="Home"
            >
              <FaHome />
            </button>

            <button
                onClick={goBack}
                className="p-2 rounded-full hover:bg-gray-200 transition"
                title="Back"
            >
              <FaArrowLeft />
            </button>

            <h2 className="text-lg font-semibold text-gray-600">
              {selectedMenuTitle} / {selectedSubMenu}
            </h2>
          </div>

          <RefDataTable
              data={refDataMap[selectedKey] ?? []}
              selectedRowId={selectedRow?.id}
              onRowSelect={setSelectedRow}
          />
        </div>

        <RightActionBar
            selectedRow={selectedRow}
            onEdit={() => setEditItem(selectedRow)}
            onDelete={() => alert(`Delete ${selectedRow?.name}`)}
        />

        {editItem && (
            <EditPanel
                data={editItem}
                onClose={() => setEditItem(null)}
                onSave={() => setEditItem(null)}
            />
        )}
      </div>
  );
};
