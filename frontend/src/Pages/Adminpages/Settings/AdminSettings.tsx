import React, { useState } from "react";
import { FiUser, FiShield, FiGlobe, FiBell, FiSave } from "react-icons/fi";
import { useAuth } from "../../../Context/AuthContext";

type SettingsTab = "profile" | "security" | "system" | "notifications";

const AdminSettings: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
    const [isSaving, setIsSaving] = useState(false);

    const [profileData, setProfileData] = useState({
        name: user?.name || "Platform Admin",
        email: user?.email || "admin@platform.com",
    });

    const [systemConfig, setSystemConfig] = useState({
        maintenanceMode: false,
        allowRegistration: true,
        aiServiceStatus: "Operational",
    });

    const handleSave = () => {
        setIsSaving(true);
        // Mock save delay
        setTimeout(() => {
            setIsSaving(false);
            alert("Settings saved successfully!");
        }, 800);
    };

    const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
        { id: "profile", label: "Admin Profile", icon: <FiUser /> },
        { id: "security", label: "Security & Roles", icon: <FiShield /> },
        { id: "system", label: "Platform Config", icon: <FiGlobe /> },
        { id: "notifications", label: "Notifications", icon: <FiBell /> },
    ];

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Platform Settings</h1>
                <p className="text-slate-500 mt-2 font-medium">Manage global platform configurations and your administrator profile.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-[1.02]"
                                : "text-slate-500 hover:bg-white hover:text-indigo-600 border border-transparent hover:border-slate-100"
                                }`}
                        >
                            <span className="text-lg">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8">
                        {activeTab === "profile" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-6">Profile Information</h3>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                                            <input
                                                type="text"
                                                value={profileData.name}
                                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                                            <input
                                                type="email"
                                                value={profileData.email}
                                                disabled
                                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 font-medium cursor-not-allowed"
                                            />
                                            <p className="text-[11px] text-slate-400 font-medium italic">Email cannot be changed by the user themselves due to platform security policy.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "system" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-6">Platform Configuration</h3>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-colors">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800">Maintenance Mode</h4>
                                                <p className="text-xs text-slate-500 font-medium mt-1">Take the entire platform offline for updates.</p>
                                            </div>
                                            <button
                                                onClick={() => setSystemConfig({ ...systemConfig, maintenanceMode: !systemConfig.maintenanceMode })}
                                                className={`w-12 h-6 rounded-full transition-all relative ${systemConfig.maintenanceMode ? "bg-red-500" : "bg-slate-200"}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${systemConfig.maintenanceMode ? "left-7" : "left-1"}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-colors">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800">Public Organization Registration</h4>
                                                <p className="text-xs text-slate-500 font-medium mt-1">Allow new organizations to sign up without invitations.</p>
                                            </div>
                                            <button
                                                onClick={() => setSystemConfig({ ...systemConfig, allowRegistration: !systemConfig.allowRegistration })}
                                                className={`w-12 h-6 rounded-full transition-all relative ${systemConfig.allowRegistration ? "bg-emerald-500" : "bg-slate-200"}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${systemConfig.allowRegistration ? "left-7" : "left-1"}`} />
                                            </button>
                                        </div>

                                        <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                                            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">System Health Overview</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white p-3 rounded-xl border border-indigo-100/50 shadow-sm">
                                                    <span className="block text-[10px] font-bold text-slate-400 uppercase">AI Services</span>
                                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
                                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Operational
                                                    </span>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-indigo-100/50 shadow-sm">
                                                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Load Balancer</span>
                                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
                                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Normal
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(activeTab === "security" || activeTab === "notifications") && (
                            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
                                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                                    {tabs.find(t => t.id === activeTab)?.icon}
                                </div>
                                <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">{activeTab} Settings coming soon</h3>
                                <p className="text-slate-400 text-sm mt-2 font-medium">These configurations are currently locked by the system kernel.</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FiSave /> Save All Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
