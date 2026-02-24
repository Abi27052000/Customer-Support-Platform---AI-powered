import React, { useEffect, useState } from "react";
import { FiSearch, FiPlus, FiX } from "react-icons/fi";
import { useAuth } from "../../../Context/AuthContext";
import { RightActionBar } from "../../../Components/AdminComponents/RefData/RightActionBar";
import EditPanel from "../../../Components/AdminComponents/RefData/EditPanel";
import type { ReferenceDataRow } from "../../../Components/AdminComponents/RefData/RefDataTable";

type StatusFilter = "all" | "active" | "pending" | "inactive";

interface StaffMember {
    _id: string;
    name: string;
    email: string;
    role: string;
    status: "Active" | "Pending" | "Inactive";
    createdAt?: string;
}

const statusStyles: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Pending: "bg-amber-50 text-amber-700 border-amber-100",
    Inactive: "bg-slate-50 text-slate-500 border-slate-100",
};

const OrgAdminStaffManagement: React.FC = () => {
    const { token } = useAuth();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<StatusFilter>("all");
    const [search, setSearch] = useState("");

    // Sidebar/Edit state
    const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
    const [editItem, setEditItem] = useState<any>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Add Staff Form State
    const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "" });

    const fetchStaff = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch('/api/org-admin/staff', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                // Ensure each staff has a status for the UI
                const staffWithStatus = data.staff.map((s: any) => ({
                    ...s,
                    status: s.status || "Active"
                }));
                setStaff(staffWithStatus);
            }
        } catch (err) {
            console.error("Failed to fetch staff", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, [token]);

    const filtered = staff.filter((s) => {
        const matchesFilter = filter === "all" || s.status.toLowerCase() === filter;
        const matchesSearch =
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase()) ||
            s.role.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        try {
            const res = await fetch('/api/org-admin/staff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newStaff)
            });
            const data = await res.json();
            if (res.ok) {
                setStaff([...staff, { ...data.staff, status: "Active" }]);
                setIsAddModalOpen(false);
                setNewStaff({ name: "", email: "", password: "" });
            } else {
                alert(data.message || "Failed to add staff");
            }
        } catch (err) {
            console.error("Add staff error:", err);
            alert("An error occurred while adding staff");
        }
    };

    const handleSave = async (updated: any) => {
        if (!token) return;
        try {
            const res = await fetch(`/api/org-admin/staff/${updated.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: updated.name, email: updated.email })
            });
            if (res.ok) {
                const updatedStaff = staff.map(s => s._id === updated.id ? { ...s, name: updated.name, email: updated.email } : s);
                setStaff(updatedStaff);
                setEditItem(null);
                const member = updatedStaff.find(s => s._id === updated.id);
                if (member) setSelectedMember(member);
            } else {
                const error = await res.json();
                alert(error.message || "Failed to update staff");
            }
        } catch (err) {
            console.error("Save error:", err);
        }
    };

    const handleDelete = async () => {
        if (!selectedMember || !token) return;
        if (!window.confirm(`Are you sure you want to remove ${selectedMember.name}?`)) return;

        try {
            const res = await fetch(`/api/org-admin/staff/${selectedMember._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setStaff(staff.filter(s => s._id !== selectedMember._id));
                setSelectedMember(null);
            } else {
                const error = await res.json();
                alert(error.message || "Failed to remove staff");
            }
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    const counts = {
        all: staff.length,
        active: staff.filter((s) => s.status === "Active").length,
        pending: staff.filter((s) => s.status === "Pending").length,
        inactive: staff.filter((s) => s.status === "Inactive").length,
    };

    const selectedRowForSidebar: ReferenceDataRow | null = selectedMember ? {
        id: selectedMember._id,
        name: selectedMember.name,
        status: selectedMember.status,
        email: selectedMember.email
    } : null;

    return (
        <div className="flex h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[calc(100vh-140px)]">
            {/* 🔹 MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                <div className="p-8 h-full flex flex-col overflow-auto">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Staff Management</h2>
                            <p className="text-slate-500 mt-2 font-medium">Manage your organization's support team members.</p>
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                        >
                            <FiPlus strokeWidth={3} /> Add Staff Member
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-6">
                        {(["all", "active", "pending", "inactive"] as StatusFilter[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}{" "}
                                <span className={`ml-1 ${filter === f ? "text-indigo-200" : "text-slate-400"}`}>({counts[f]})</span>
                            </button>
                        ))}
                    </div>

                    {/* Search Field */}
                    <div className="relative max-w-md mb-8">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or role..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700"
                        />
                    </div>

                    {/* Staff Table */}
                    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex-1">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                                <tr>
                                    <th className="text-left px-6 py-4">Staff Member</th>
                                    <th className="text-left px-6 py-4">Email Address</th>
                                    <th className="text-left px-6 py-4">Access Role</th>
                                    <th className="text-left px-6 py-4">Status</th>
                                    <th className="text-right px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500/20 border-t-indigo-500 mb-2"></div>
                                            <p className="text-slate-400 font-bold">Fetching team data...</p>
                                        </td>
                                    </tr>
                                ) : filtered.map((member) => (
                                    <tr
                                        key={member._id}
                                        onClick={() => setSelectedMember(member)}
                                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${selectedMember?._id === member._id ? "bg-indigo-50/30" : ""}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold shadow-sm">
                                                    {member.name.split(" ").map((n) => n[0]).join("")}
                                                </div>
                                                <span className="font-bold text-slate-800">{member.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-medium">{member.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded text-[11px] uppercase tracking-wide border border-slate-200">
                                                {member.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${statusStyles[member.status]}`}>
                                                {member.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedMember(member); setEditItem({ id: member._id, name: member.name, email: member.email, status: member.status }); }}
                                                className="text-indigo-600 hover:text-indigo-800 font-bold text-xs"
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No staff members found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 🔹 RIGHT ACTION BAR (Pattern from RefData) */}
            <div className="flex-shrink-0 flex items-stretch">
                <RightActionBar
                    selectedRow={selectedRowForSidebar}
                    onEdit={() => setEditItem(selectedRowForSidebar)}
                    onDelete={handleDelete}
                />
            </div>

            {/* 🔹 EDIT PANEL */}
            {editItem && (
                <EditPanel
                    data={editItem}
                    onClose={() => setEditItem(null)}
                    onSave={handleSave}
                />
            )}

            {/* 🔹 ADD STAFF MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-slate-800">New Staff Member</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <FiX size={20} className="text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleAddStaff} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newStaff.name}
                                        onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                        placeholder="Enter staff name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={newStaff.email}
                                        onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                        placeholder="email@organization.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Initial Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={newStaff.password}
                                        onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="flex-1 px-6 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors active:scale-95"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                                    >
                                        Register Staff
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrgAdminStaffManagement;
