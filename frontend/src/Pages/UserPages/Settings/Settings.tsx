import React, { useState } from "react";
import { FiUser, FiShield, FiBriefcase, FiBell, FiSave } from "react-icons/fi";
import { useAuth } from "../../../Context/AuthContext";

type SettingsTab = "profile" | "organization" | "security" | "notifications";

const Settings: React.FC = () => {
  const { user, orgs } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isSaving, setIsSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const handleSave = () => {
    setIsSaving(true);
    // Mock save delay
    setTimeout(() => {
      setIsSaving(false);
      alert("Profile updated successfully!");
    }, 800);
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "My Profile", icon: <FiUser /> },
    { id: "organization", label: "My Organizations", icon: <FiBriefcase /> },
    { id: "security", label: "Security", icon: <FiShield /> },
    { id: "notifications", label: "Notifications", icon: <FiBell /> },
  ];

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Account Settings</h1>
        <p className="text-slate-500 mt-2 font-medium text-lg">Manage your personal information and organization access.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Navigation Tabs */}
        <div className="w-full lg:w-72 space-y-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 translate-x-1"
                  : "bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100"
                }`}
            >
              <span className="text-xl">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Panel */}
        <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-10 flex-1">
            {activeTab === "profile" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-100">
                      {profileData.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">Profile Details</h3>
                      <p className="text-slate-400 font-medium">Your public identity on the platform</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Display Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Registered Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 font-bold cursor-not-allowed opacity-70"
                      />
                      <div className="flex items-center gap-2 ml-1 mt-2">
                        <FiShield className="text-emerald-500" />
                        <p className="text-[11px] text-slate-400 font-bold italic tracking-wide">Verified by System Security</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "organization" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-6">Workspaces & Organizations</h3>
                  <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                    These are the organizations you currently have access to. You can switch between them from the login screen or organization picker.
                  </p>

                  <div className="grid grid-cols-1 gap-4">
                    {orgs && orgs.length > 0 ? orgs.map((org) => (
                      <div key={org.id} className="group p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all cursor-default">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 font-black border border-slate-100 group-hover:scale-110 transition-transform">
                              {org.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-lg">{org.name}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Active Member</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                        <p className="text-slate-400 font-bold">No active organization memberships found.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(activeTab === "security" || activeTab === "notifications") && (
              <div className="flex flex-col items-center justify-center py-24 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-6">
                  {tabs.find(t => t.id === activeTab)?.icon}
                </div>
                <h3 className="text-xl font-black text-slate-300 uppercase tracking-[0.3em]">Module Locked</h3>
                <p className="text-slate-400 text-sm mt-3 font-bold tracking-wide">Contact your Organization Admin to adjust these settings.</p>
              </div>
            )}
          </div>

          {activeTab === "profile" && (
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-3 px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-95 disabled:bg-slate-300 disabled:shadow-none uppercase tracking-widest text-xs"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <FiSave className="text-lg" /> Update Profile
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
