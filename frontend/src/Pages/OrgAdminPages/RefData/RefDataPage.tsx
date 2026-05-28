import React, { useEffect, useState } from "react";
import { RefDataSidebar } from "../../../Components/AdminComponents/RefData/RefDataSidebar";
import { RefDataTable } from "../../../Components/AdminComponents/RefData/RefDataTable";
import { RightActionBar } from "../../../Components/AdminComponents/RefData/RightActionBar";
import EditPanel from "../../../Components/AdminComponents/RefData/EditPanel";
import { useAuth } from "../../../Context/AuthContext";

import type { ReferenceDataRow } from "../../../Components/AdminComponents/RefData/RefDataTable";
import type { RefDataSidebarItemProps } from "../../../Components/AdminComponents/RefData/RefDataSidebarItem";
import { FaHome, FaArrowLeft } from "react-icons/fa";

// 🔹 ORG ADMIN MENU CONFIG
const menuItems: RefDataSidebarItemProps[] = [
    { title: "Service Users", keyName: "users", subMenu: ["All"] },
    { title: "Categories", keyName: "categories", subMenu: ["All", "Active", "Inactive"] },
    { title: "Tags", keyName: "tags", subMenu: ["All", "Active", "Inactive"] },
    { title: "Templates", keyName: "templates", subMenu: ["All", "Active", "Inactive"] },
];

// 🔹 ORG ADMIN DATA MAP (Mock data for categories, tags, templates)
const refDataMap: Record<string, ReferenceDataRow[]> = {
    categories_all: [
        { id: "1", name: "Billing & Payments", status: "Active" },
        { id: "2", name: "Account Management", status: "Active" },
        { id: "3", name: "Technical Support", status: "Active" },
        { id: "4", name: "Product Inquiries", status: "Active" },
        { id: "5", name: "Returns & Exchanges", status: "Active" },
        { id: "6", name: "Shipping & Delivery", status: "Active" },
        { id: "7", name: "General Inquiries", status: "Active" },
        { id: "8", name: "Feedback & Suggestions", status: "Inactive" },
        { id: "9", name: "Compliance", status: "Inactive" },
        { id: "10", name: "Onboarding", status: "Active" },
    ],

    categories_active: [
        { id: "1", name: "Billing & Payments", status: "Active" },
        { id: "2", name: "Account Management", status: "Active" },
        { id: "3", name: "Technical Support", status: "Active" },
        { id: "4", name: "Product Inquiries", status: "Active" },
        { id: "5", name: "Returns & Exchanges", status: "Active" },
    ],

    categories_inactive: [
        { id: "8", name: "Feedback & Suggestions", status: "Inactive" },
        { id: "9", name: "Compliance", status: "Inactive" },
    ],

    tags_all: [
        { id: "1", name: "Urgent", status: "Active" },
        { id: "2", name: "VIP Customer", status: "Active" },
        { id: "3", name: "Follow-up", status: "Active" },
        { id: "4", name: "Escalated", status: "Active" },
        { id: "5", name: "Feedback", status: "Active" },
        { id: "6", name: "Spam", status: "Inactive" },
        { id: "7", name: "New Customer", status: "Active" },
        { id: "8", name: "Recurring Issue", status: "Active" },
        { id: "9", name: "Priority", status: "Active" },
        { id: "10", name: "Archived", status: "Inactive" },
    ],

    tags_active: [
        { id: "1", name: "Urgent", status: "Active" },
        { id: "2", name: "VIP Customer", status: "Active" },
        { id: "3", name: "Follow-up", status: "Active" },
        { id: "4", name: "Escalated", status: "Active" },
        { id: "5", name: "Feedback", status: "Active" },
    ],

    tags_inactive: [
        { id: "6", name: "Spam", status: "Inactive" },
        { id: "10", name: "Archived", status: "Inactive" },
    ],

    templates_all: [
        { id: "1", name: "Welcome Message", status: "Active" },
        { id: "2", name: "Refund Acknowledgement", status: "Active" },
        { id: "3", name: "Ticket Escalation", status: "Active" },
        { id: "4", name: "Resolution Follow-up", status: "Active" },
        { id: "5", name: "Out of Office", status: "Inactive" },
        { id: "6", name: "Satisfaction Survey", status: "Active" },
        { id: "7", name: "Password Reset", status: "Active" },
        { id: "8", name: "Account Verification", status: "Active" },
        { id: "9", name: "Order Confirmation", status: "Active" },
        { id: "10", name: "Closing Ticket", status: "Active" },
    ],

    templates_active: [
        { id: "1", name: "Welcome Message", status: "Active" },
        { id: "2", name: "Refund Acknowledgement", status: "Active" },
        { id: "3", name: "Ticket Escalation", status: "Active" },
        { id: "4", name: "Resolution Follow-up", status: "Active" },
        { id: "6", name: "Satisfaction Survey", status: "Active" },
    ],

    templates_inactive: [
        { id: "5", name: "Out of Office", status: "Inactive" },
    ],
};


const OrgAdminRefData: React.FC = () => {
    const { token } = useAuth();
    const [users, setUsers] = useState<ReferenceDataRow[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // 🔹 STATE
    const [selectedKey, setSelectedKey] = useState<string>("users_all");
    const [selectedMenuTitle, setSelectedMenuTitle] = useState<string>("Service Users");
    const [selectedSubMenu, setSelectedSubMenu] = useState<string>("All");
    const [selectedRow, setSelectedRow] = useState<ReferenceDataRow | null>(null);
    const [editItem, setEditItem] = useState<ReferenceDataRow | null>(null);

    const FIRST_MENU = menuItems[0];
    const FIRST_SUB = FIRST_MENU.subMenu?.[0] ?? "All";

    const fetchUsers = async () => {
        if (!token) return;
        setLoadingUsers(true);
        try {
            const res = await fetch('/api/org-admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                const userData = data.users.map((u: any) => ({
                    id: u._id,
                    name: u.name,
                    status: "Active",
                    email: u.email,
                    role: u.role
                }));
                setUsers(userData);
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const currentData = selectedKey.startsWith("users")
        ? users
        : (refDataMap[selectedKey] || []);

    // 🔹 AUTO SELECT FIRST ROW
    useEffect(() => {
        setSelectedRow(currentData?.[0] ?? null);
    }, [selectedKey, users]);

    const handleSave = async (updated: any) => {
        if (!token || !selectedKey.startsWith("users")) {
            setEditItem(null);
            return;
        }

        try {
            const res = await fetch(`/api/org-admin/users/${updated.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: updated.name
                })
            });

            if (res.ok) {
                const updatedUsers = users.map(u => u.id === updated.id ? updated : u);
                setUsers(updatedUsers);
                setEditItem(null);
                setSelectedRow(updated);
            } else {
                const error = await res.json();
                alert(error.message || "Failed to update user");
            }
        } catch (err) {
            console.error("Save error:", err);
            alert("An error occurred while saving");
        }
    };

    const handleDelete = async () => {
        if (!selectedRow || !token || !selectedKey.startsWith("users")) return;

        if (!window.confirm(`Are you sure you want to remove ${selectedRow.name} from the organization?`)) return;

        try {
            const res = await fetch(`/api/org-admin/users/${selectedRow.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const updatedUsers = users.filter(u => u.id !== selectedRow.id);
                setUsers(updatedUsers);
                setSelectedRow(null);
            } else {
                const error = await res.json();
                alert(error.message || "Failed to remove user");
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
                    {/* 🔹 HEADER WITH ICONS */}
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
                            {loadingUsers && selectedKey.startsWith("users") ? (
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

export default OrgAdminRefData;
