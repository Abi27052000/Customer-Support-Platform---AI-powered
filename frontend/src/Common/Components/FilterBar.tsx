import React from "react";

const FilterBar: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <input className="border rounded p-2" placeholder="Search conversations" />
        <select className="border rounded p-2">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button className="px-3 py-2 border rounded hover:bg-[#f3f4ff]">Filter</button>
        <button className="px-3 py-2 bg-[#2D2A8C] text-white rounded">New Conversation</button>
      </div>
    </div>
  );
}

export default FilterBar;

