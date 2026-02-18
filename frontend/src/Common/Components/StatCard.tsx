import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, color = "#2D2A8C" }) => {
  return (
    <div className="p-4 rounded-lg border bg-gradient-to-br from-white to-[#f7f8ff]">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm text-gray-500">{title}</h4>
          <div className="text-2xl font-bold" style={{ color }}>{value}</div>
        </div>
      </div>
      {description && <p className="text-xs text-gray-400 mt-3">{description}</p>}
    </div>
  );
};

export default StatCard;

