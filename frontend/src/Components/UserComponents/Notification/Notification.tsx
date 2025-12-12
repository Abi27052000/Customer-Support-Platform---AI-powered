import React from "react";
import { Bell } from "lucide-react";

interface NotificationIconProps {
  count: number;
  icon?: React.ReactNode; 
}

const NotificationIcon: React.FC<NotificationIconProps> = ({ count }) => {
  return (
    <button className="relative">
      {/* Notification Bubble */}
      <div className="absolute -top-1.5 -right-2.5 w-5 h-5 bg-white rounded-full flex items-center justify-center">
        <span className="bg-red-600 text-white rounded-full w-full h-full flex items-center justify-center text-xs">
          {count}
        </span>
      </div>

      {/* Bell Icon */}
      <Bell className="w-6 h-6 text-blue-700" />
    </button>
  );
};

export default NotificationIcon;
