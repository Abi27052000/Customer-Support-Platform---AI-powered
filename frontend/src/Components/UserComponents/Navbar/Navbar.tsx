import { useAuth } from "../../../Context/AuthContext";
import NotificationIcon from "../Notification/Notification";
import ProfileAvatar from "../../../Pages/UserPages/Profile/Profile";
import { FaBell, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-200">Main Admin</span>;
      case 'organization_admin':
        return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-purple-200">Org Admin</span>;
      case 'organization_staff':
        return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-200">Staff</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-200">User</span>;
    }
  };

  return (
    <div className="w-full h-18 px-8 bg-white border-b border-slate-100 shadow-sm flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-2">
        {/* Left side space if needed */}
      </div>

      <div className="flex items-center gap-6">
        {user ? (
          <div className="flex items-center gap-4 border-r border-slate-200 pr-6 mr-2">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">{user.name}</span>
                {getRoleBadge(user.role)}
              </div>
              <span className="text-[11px] text-slate-400 font-medium">{user.email}</span>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <FaSignOutAlt size={18} />
            </button>
          </div>
        ) : (
          <h2 className="font-bold text-[#2D2A8C] mr-4 text-sm tracking-tight">PLATFORM ACCESS</h2>
        )}

        <div className="flex items-center gap-3">
          <NotificationIcon icon={<FaBell className="text-slate-500" />} count={3} />
          <ProfileAvatar src="https://ui-avatars.com/api/?name=" />
        </div>
      </div>
    </div>
  );
}
