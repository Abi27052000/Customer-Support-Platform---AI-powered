import React, { useEffect, useState } from "react";
import { RefDataSidebar } from "../../../Components/AdminComponents/RefData/RefDataSidebar";
import { RefDataTable } from "../../../Components/AdminComponents/RefData/RefDataTable";
import { RightActionBar } from "../../../Components/AdminComponents/RefData/RightActionBar";
import EditPanel from "../../../Components/AdminComponents/RefData/EditPanel";
import { useAuth } from "../../../Context/AuthContext";

import type { ReferenceDataRow } from "../../../Components/AdminComponents/RefData/RefDataTable";
import type { RefDataSidebarItemProps } from "../../../Components/AdminComponents/RefData/RefDataSidebarItem";
import { FaHome, FaArrowLeft } from "react-icons/fa";

// 🔹 MENU CONFIG
const menuItems: RefDataSidebarItemProps[] = [
  { title: "Organizations", keyName: "organizations", subMenu: ["All"] },
  { title: "Units", keyName: "units", subMenu: ["All", "Active", "Inactive"] },
  { title: "Users", keyName: "users", subMenu: ["All", "Active", "Pending"] },
  { title: "Roles", keyName: "roles", subMenu: ["All", "Admin", "User"] },
];

// 🔹 DATA MAP (for other sections)
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
  ],
  units_inactive: [],
  users_all: [
    { id: "1", name: "John Smith", status: "Active" },
    { id: "2", name: "Mary Johnson", status: "Active" },
  ],
  users_active: [],
  users_pending: [],
  roles_all: [
    { id: "1", name: "Administrator", status: "Active" },
    { id: "2", name: "Manager", status: "Active" },
  ],
  roles_admin: [],
  roles_user: [],
};


export const ReferenceDataPage: React.FC = () => {
  const { token } = useAuth();
  const [organizations, setOrganizations] = useState<ReferenceDataRow[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // 🔹 STATE (unchanged mostly)
  const [selectedKey, setSelectedKey] = useState<string>("organizations_all");
  const [selectedMenuTitle, setSelectedMenuTitle] = useState<string>("Organizations");
  const [selectedSubMenu, setSelectedSubMenu] = useState<string>("All");
  const [selectedRow, setSelectedRow] = useState<ReferenceDataRow | null>(null);
  const [editItem, setEditItem] = useState<ReferenceDataRow | null>(null);

  useEffect(() => {
    const fetchOrgs = async () => {
      if (!token) return;
      setLoadingOrgs(true);
      try {
        const res = await fetch('/api/admin/organizations', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          const orgs = data.organizations.map((o: any) => ({
            id: o._id,
            name: o.name,
            status: "Active",
            services: o.services
          }));
          setOrganizations(orgs);
        }
      } catch (err) {
        console.error("Error fetching orgs:", err);
      } finally {
        setLoadingOrgs(false);
      }
    };
    fetchOrgs();
  }, [token]);

  const currentData = selectedKey.startsWith("organizations")
    ? organizations
    : (refDataMap[selectedKey] || []);

  const FIRST_MENU = menuItems[0];
  const FIRST_SUB = FIRST_MENU.subMenu?.[0] ?? "All";

  // 🔹 AUTO SELECT FIRST ROW
  useEffect(() => {
    setSelectedRow(currentData?.[0] ?? null);
  }, [selectedKey, organizations]);

  const handleSave = async (updated: any) => {
    if (!token || !selectedKey.startsWith("organizations")) {
      // Only organizations are editable for now
      setEditItem(null);
      return;
    }

    try {
      const res = await fetch(`/api/admin/organizations/${updated.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: updated.name,
          adminEmail: updated.email,
          services: updated.services
        })
      });

      if (res.ok) {
        // Refresh orgs
        const updatedOrgs = organizations.map(o => o.id === updated.id ? updated : o);
        setOrganizations(updatedOrgs);
        setEditItem(null);
        setSelectedRow(updated);
      } else {
        const error = await res.json();
        alert(error.message || "Failed to update organization");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("An error occurred while saving");
    }
  };

  const handleDelete = async () => {
    if (!selectedRow || !token || !selectedKey.startsWith("organizations")) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedRow.name}?`)) return;

    try {
      const res = await fetch(`/api/admin/organizations/${selectedRow.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const updatedOrgs = organizations.filter(o => o.id !== selectedRow.id);
        setOrganizations(updatedOrgs);
        setSelectedRow(null);
      } else {
        const error = await res.json();
        alert(error.message || "Failed to delete organization");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("An error occurred while deleting");
    }
  };

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
    const parentSub = FIRST_SUB;
    setSelectedKey(`${currentMenu}_${parentSub.toLowerCase()}`);
    setSelectedSubMenu(parentSub);
  };

  return (
    <div className="flex h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[calc(100vh-140px)]">
      {/* 🔹 SIDEBAR - Fixed width, won't scroll */}
      <div className="flex-shrink-0 border-r border-slate-100">
        <RefDataSidebar
          menuItems={menuItems}
          onSelect={(keyName, subMenu) => {
            const key = `${keyName}_${subMenu.toLowerCase()}`;
            setSelectedKey(key);
            const menuTitle = menuItems.find((item) => item.keyName === keyName)?.title ?? "";
            setSelectedMenuTitle(menuTitle);
            setSelectedSubMenu(subMenu);
            setEditItem(null);
          }}
          selectedKeyName={selectedKey.split("_")[0]}
          selectedSubMenu={selectedSubMenu}
        />
      </div>

      {/* 🔹 MAIN CONTENT - Flexible width with internal scrolling */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="p-6 h-full flex flex-col">
          {/* 🔹 UPDATED HEADER WITH ICONS */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Reference Data</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-medium text-slate-400">{selectedMenuTitle}</span>
                <span className="text-slate-300">/</span>
                <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{selectedSubMenu}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={goHome}
                className="p-2.5 rounded-xl hover:bg-slate-100 transition-all text-slate-500 hover:text-indigo-600 border border-transparent hover:border-slate-200"
                title="Home"
              >
                <FaHome size={18} />
              </button>
              <button
                onClick={goBack}
                className="p-2.5 rounded-xl hover:bg-slate-100 transition-all text-slate-500 hover:text-indigo-600 border border-transparent hover:border-slate-200"
                title="Back"
              >
                <FaArrowLeft size={18} />
              </button>
            </div>
          </div>

          {/* 🔹 TABLE CONTAINER - Scrollable independently */}
          <div className="flex-1 overflow-auto border border-slate-100 rounded-xl">
            <div className="min-w-full">
              {loadingOrgs && selectedKey.startsWith("organizations") ? (
                <div className="p-20 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500/20 border-t-indigo-500 mb-4"></div>
                  <div className="text-slate-400 font-medium">Loading records...</div>
                </div>
              ) : (
                <RefDataTable
                  data={currentData}
                  selectedRowId={selectedRow?.id}
                  onRowSelect={setSelectedRow}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 RIGHT ACTION BAR - Fixed width inside the flex container, no overlap */}
      <div className="flex-shrink-0 flex items-stretch">
        <RightActionBar
          selectedRow={selectedRow}
          onEdit={() => setEditItem(selectedRow)}
          onDelete={handleDelete}
        />
      </div>

      {editItem && (
        <EditPanel
          data={editItem}
          onClose={() => setEditItem(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};