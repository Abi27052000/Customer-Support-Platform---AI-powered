import React, { useState } from "react";
import { FiUser, FiClock, FiSettings, FiBell, FiSave, FiCoffee } from "react-icons/fi";
import { useAuth } from "../../Context/AuthContext";

const OrgStaffSettings: React.FC = () => {
  const { user } = useAuth();
  const [emailNotif, setEmailNotif] = useState('All');
  const [autoAssign, setAutoAssign] = useState(true);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("Staff preferences saved!");
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight text-center lg:text-left">Workplace Profile</h1>
        <p className="text-slate-500 mt-2 font-medium text-lg text-center lg:text-left">Manage your availability and personal notification preferences.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* Profile Header */}
        <div className="p-10 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 rounded-3xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-indigo-100">
            {user?.name?.charAt(0).toUpperCase() || "S"}
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-black text-slate-800">{user?.name || "Staff Member"}</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">{user?.role?.replace('_', ' ') || "Organization Staff"}</p>
            <div className="flex items-center gap-2 mt-3 justify-center md:justify-start">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-black text-emerald-600 tracking-widest uppercase">System Online</span>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-10">
          {/* Availability Block */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <FiClock className="text-xl" />
                <h4 className="font-black uppercase tracking-widest text-xs">Work Schedule</h4>
              </div>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">Set your active hours to help with ticket routing.</p>
            </div>
            <div className="md:col-span-2 flex items-center gap-4">
              <input type="time" className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700" defaultValue="09:00" />
              <span className="text-slate-300 font-black">UNTIL</span>
              <input type="time" className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700" defaultValue="18:00" />
            </div>
          </div>

          <hr className="border-slate-50" />

          {/* Routing Block */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <FiSettings className="text-xl" />
                <h4 className="font-black uppercase tracking-widest text-xs">Queue Handling</h4>
              </div>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">Configure how incoming conversations are assigned.</p>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-100 group transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
                    <FiCoffee />
                  </div>
                  <div>
                    <span className="block font-bold text-slate-800">Auto-assign Tickets</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active when status is online</span>
                  </div>
                </div>
                <button
                  onClick={() => setAutoAssign(!autoAssign)}
                  className={`w-14 h-7 rounded-full transition-all relative ${autoAssign ? "bg-indigo-600" : "bg-slate-200"}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${autoAssign ? "left-8" : "left-1"}`} />
                </button>
              </label>
            </div>
          </div>

          <hr className="border-slate-50" />

          {/* Preferences Block */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <FiBell className="text-xl" />
                <h4 className="font-black uppercase tracking-widest text-xs">Notifications</h4>
              </div>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">Control how the platform reaches out to you.</p>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block md:text-left">Push Level</label>
                <select value={emailNotif} onChange={(e) => setEmailNotif(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 appearance-none cursor-pointer">
                  <option>All Alerts</option>
                  <option>Important Only</option>
                  <option>Muted</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block md:text-left">Local Timezone</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 appearance-none cursor-pointer">
                  <option>Asia/Kolkata</option>
                  <option>UTC</option>
                  <option>America/New_York</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center md:justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-3 w-full md:w-auto px-12 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest text-xs"
          >
            {isSaving ? "Syncing..." : "Commit Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrgStaffSettings;
