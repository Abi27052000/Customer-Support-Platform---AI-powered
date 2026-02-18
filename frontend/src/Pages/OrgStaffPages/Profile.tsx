import React, { useEffect, useState } from "react";

const OrgStaffProfile: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    (async () => {
      try {
        const res = await fetch('/api/auth/session', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4">
            <img src="/vite.svg" alt="avatar" className="w-20 h-20 rounded-full object-cover" />
            <div>
              <h2 className="text-xl font-semibold text-[#2D2A8C]">{user?.email || 'Staff Name'}</h2>
              <p className="text-sm text-gray-500">{user?.role || 'Organization Staff'}</p>
              <p className="text-sm text-gray-500">Organization: {user?.orgId || '—'}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="text-sm text-gray-600">Member since: <span className="font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span></div>
            <div className="text-sm text-gray-600">Assigned conversations: <span className="font-medium">12</span></div>
            <div className="text-sm text-gray-600">Resolved: <span className="font-medium">120</span></div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-[#2D2A8C]">Edit Profile</h3>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full Name</label>
              <input className="w-full rounded-md border p-2" placeholder="Your full name" defaultValue={user?.adminName || ''} />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone</label>
              <input className="w-full rounded-md border p-2" placeholder="Phone number" />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input className="w-full rounded-md border p-2" defaultValue={user?.email || ''} />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Role</label>
              <input className="w-full rounded-md border p-2" defaultValue={user?.role || 'Organization Staff'} readOnly />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button className="px-4 py-2 bg-[#2D2A8C] text-white rounded">Save Changes</button>
            <button className="px-4 py-2 border rounded">Deactivate account</button>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700">Recent activity</h4>
            <ul className="mt-2 text-sm text-gray-600 list-disc pl-6">
              <li>Replied to conversation C-1002</li>
              <li>Marked C-1003 as Resolved</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgStaffProfile;
