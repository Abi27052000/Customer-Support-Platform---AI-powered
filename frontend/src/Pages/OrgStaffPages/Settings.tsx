import React, { useState } from "react";

const OrgStaffSettings: React.FC = () => {
  const [emailNotif, setEmailNotif] = useState('All');
  const [autoAssign, setAutoAssign] = useState(true);
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
        <h2 className="text-2xl font-bold text-[#2D2A8C]">Settings</h2>
        <p className="text-gray-600">Personal and notification settings for your staff account.</p>

        <div className="mt-6 space-y-6">
          <div className="border rounded p-4">
            <h4 className="font-semibold text-gray-700">Availability</h4>
            <p className="text-sm text-gray-500">Set your working hours so the system can prioritize routing.</p>
            <div className="mt-3 flex items-center gap-3">
              <input type="time" className="border rounded p-2" />
              <span className="text-sm text-gray-400">to</span>
              <input type="time" className="border rounded p-2" />
            </div>
          </div>

          <div className="border rounded p-4">
            <h4 className="font-semibold text-gray-700">Auto-assign</h4>
            <p className="text-sm text-gray-500">When enabled, incoming conversations are automatically assigned based on availability.</p>
            <div className="mt-3 flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={autoAssign} onChange={() => setAutoAssign(!autoAssign)} />
                <span className="text-sm">Enable auto-assign</span>
              </label>
            </div>
          </div>

          <div className="border rounded p-4">
            <h4 className="font-semibold text-gray-700">Notifications</h4>
            <p className="text-sm text-gray-500">Manage how you receive notifications.</p>
            <div className="mt-3 flex items-center gap-3">
              <select value={emailNotif} onChange={(e) => setEmailNotif(e.target.value)} className="border rounded p-2">
                <option>All</option>
                <option>Important only</option>
                <option>None</option>
              </select>

              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="border rounded p-2">
                <option>UTC</option>
                <option>Asia/Kolkata</option>
                <option>America/New_York</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-[#2D2A8C] text-white rounded">Save changes</button>
            <button className="px-4 py-2 border rounded">Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgStaffSettings;
