import { useEffect, useState } from "react";
import NotificationIcon from "../Notification/Notification";
import ProfileAvatar from "../../../Pages/UserPages/Profile/Profile";
import { FaBell } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    (async () => {
      try {
        const res = await fetch('/api/auth/session', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        setUserEmail(data.user?.email || null);
      } catch {
        // ignore errors silently
      }
    })();
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    try {
      await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch {
      // ignore
    }
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="w-full h-18 px-12 bg-white shadow-md flex items-center justify-end">
      <div className="flex items-center gap-6">
        {userEmail ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{userEmail}</span>
            <button onClick={handleLogout} className="px-3 py-1 bg-[#2D2A8C] text-white rounded">Logout</button>
          </div>
        ) : (
          <h2 className="font-bold text-[#2D2A8C]">WELL COME REMI</h2>
        )}

        <NotificationIcon icon={<FaBell />} count={3} />
        <ProfileAvatar src="https://cdn.pixabay.com/photo/2016/11/21/11/17/model-1844729_640.jpg" />
      </div>
    </div>
  );
}
