import React, { useState } from "react";
import { FiBriefcase, FiShield, FiBell, FiCreditCard, FiSave, FiClock, FiMail, FiPhone, FiGlobe } from "react-icons/fi";

type SettingsTab = "profile" | "roles" | "notifications" | "billing";

const OrgAdminSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
    const [isSaving, setIsSaving] = useState(false);

    const [orgData, setOrgData] = useState({
        name: "Acme Support Co.",
        email: "admin@acmesupport.com",
        phone: "+91 9876543210",
        timezone: "Asia/Kolkata",
    });

    const [notifs, setNotifs] = useState({
        email: true,
        slack: false,
        escalation: true,
        digest: true
    });

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            alert("Organization settings updated!");
        }, 800);
    };

    const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
        { id: "profile", label: "Org Profile", icon: <FiBriefcase /> },
        { id: "roles", label: "Roles & Access", icon: <FiShield /> },
        { id: "notifications", label: "Alerts", icon: <FiBell /> },
        { id: "billing", label: "Subscription", icon: <FiCreditCard /> },
    ];

    const roles = [
        { name: "Organization Admin", permissions: "Full access", members: 2 },
        { name: "Team Lead", permissions: "Manage staff, view reports", members: 3 },
        { name: "Support Agent", permissions: "Handle tickets, view resources", members: 14 },
    ];

    return (
        <div className="max-w-6xl mx-auto py-4">
            <div className="mb-10">
                <h1 className="text-4xl font-black text-slate-800 tracking-tight">Organization Control Center</h1>
                <p className="text-slate-500 mt-2 font-medium text-lg">Configure your organization's workflow, permissions, and billing.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
                {/* Navigation Sidebar */}
                <div className="w-full lg:w-72 space-y-3">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id
                                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 translate-x-1"
                                    : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
                                }`}
                        >
                            <span className="text-xl">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[600px]">
                    <div className="p-10 flex-1">
                        {activeTab === "profile" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="border-b border-slate-50 pb-8">
                                    <h3 className="text-2xl font-bold text-slate-800">Company Identity</h3>
                                    <p className="text-slate-400 font-medium mt-1">Update your organization's public and contact information.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                                        <div className="relative">
                                            <FiBriefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="text"
                                                value={orgData.name}
                                                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Support Email</label>
                                        <div className="relative">
                                            <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="email"
                                                value={orgData.email}
                                                onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Phone</label>
                                        <div className="relative">
                                            <FiPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="tel"
                                                value={orgData.phone}
                                                onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Timezone</label>
                                        <div className="relative">
                                            <FiGlobe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                                            <select
                                                value={orgData.timezone}
                                                onChange={(e) => setOrgData({ ...orgData, timezone: e.target.value })}
                                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                                            >
                                                <option>Asia/Kolkata</option>
                                                <option>UTC</option>
                                                <option>America/New_York</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "roles" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800">Role Architecture</h3>
                                        <p className="text-slate-400 font-medium">Define access levels and staff permissions.</p>
                                    </div>
                                    <button className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors">
                                        + Design Role
                                    </button>
                                </div>

                                <div className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-100">
                                    <table className="w-full text-sm">
                                        <thead className="bg-white border-b border-slate-100 font-black text-slate-400 uppercase tracking-[0.15em] text-[10px]">
                                            <tr>
                                                <th className="text-left px-8 py-5">System Role</th>
                                                <th className="text-left px-8 py-5">Capabilities</th>
                                                <th className="text-right px-8 py-5">Assignment</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {roles.map((role) => (
                                                <tr key={role.name} className="hover:bg-white transition-colors duration-200">
                                                    <td className="px-8 py-6 font-bold text-slate-800">{role.name}</td>
                                                    <td className="px-8 py-6 text-slate-500 font-medium">{role.permissions}</td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-indigo-500">
                                                            {role.members} MEMBERS
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === "notifications" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="border-b border-slate-50 pb-8">
                                    <h3 className="text-2xl font-bold text-slate-800">System Alerts</h3>
                                    <p className="text-slate-400 font-medium mt-1">Global notification routing for the whole organization.</p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { key: 'email', label: "Omnichannel Email", desc: "Critical system event routing to admin email" },
                                        { key: 'slack', label: "Slack Integration", desc: "Push real-time alerts to active workspace channels" },
                                        { key: 'escalation', label: "VIP Escalations", desc: "Instant paging for high-priority support tickets" },
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-white transition-all">
                                            <div>
                                                <h4 className="font-bold text-slate-800 tracking-tight">{item.label}</h4>
                                                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">{item.desc}</p>
                                            </div>
                                            <button
                                                onClick={() => setNotifs({ ...notifs, [item.key]: !notifs[item.key as keyof typeof notifs] })}
                                                className={`w-14 h-7 rounded-full transition-all relative ${notifs[item.key as keyof typeof notifs] ? "bg-indigo-600" : "bg-slate-200"}`}
                                            >
                                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${notifs[item.key as keyof typeof notifs] ? "left-8" : "left-1"}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "billing" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="border-b border-slate-50 pb-8">
                                    <h3 className="text-2xl font-bold text-slate-800">Financial Suite</h3>
                                    <p className="text-slate-400 font-medium mt-1">Manage subscriptions, billing cycles, and enterprise assets.</p>
                                </div>

                                <div className="p-8 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-2xl shadow-indigo-100 border border-indigo-500/30">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-4">
                                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black tracking-[0.2em]">CURRENT TIER</span>
                                            <h4 className="text-4xl font-black">Business Enterprise</h4>
                                            <p className="text-indigo-100 font-medium text-sm leading-relaxed max-w-sm">
                                                Unlimited staff, global AI translation, and dedicated enterprise support manager.
                                            </p>
                                        </div>
                                        <button className="px-6 py-3 bg-white text-indigo-700 font-black rounded-2xl hover:bg-slate-50 transition-colors shadow-lg">
                                            UPGRADE
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Cost</span>
                                        <p className="text-2xl font-black text-slate-800 mt-1">₹4,999</p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Cycle</span>
                                        <p className="text-2xl font-black text-slate-800 mt-1">Mar 15</p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</span>
                                        <p className="text-lg font-black text-slate-800 mt-1">VISA •••• 4242</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-3 px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest text-xs"
                        >
                            {isSaving ? "Updating Assets..." : "Execute Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrgAdminSettings;
