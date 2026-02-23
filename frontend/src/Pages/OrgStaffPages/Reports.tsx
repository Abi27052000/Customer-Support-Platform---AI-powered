import React from "react";

const OrgStaffReports: React.FC = () => {
  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#2D2A8C] mb-4">Reports</h2>
          <div className="flex items-center gap-3">
            <select className="border rounded p-2">
              <option>This week</option>
              <option>This month</option>
              <option>Custom range</option>
            </select>
            <button className="px-3 py-2 bg-[#2D2A8C] text-white rounded">
              Export CSV
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded border bg-gradient-to-br from-white to-[#f7f8ff]">
            <h4 className="text-sm text-gray-500">Avg Response Time</h4>
            <div className="text-xl font-semibold text-[#2D2A8C]">1h 23m</div>
          </div>

          <div className="p-4 rounded border bg-gradient-to-br from-white to-[#f7f8ff]">
            <h4 className="text-sm text-gray-500">Resolved</h4>
            <div className="text-xl font-semibold text-[#2D2A8C]">5</div>
          </div>

          <div className="p-4 rounded border bg-gradient-to-br from-white to-[#f7f8ff]">
            <h4 className="text-sm text-gray-500">Satisfaction</h4>
            <div className="text-xl font-semibold text-[#2D2A8C]">4.2 / 5</div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm table-auto">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="py-3">Date</th>
                <th className="py-3">Metric</th>
                <th className="py-3">Value</th>
                <th className="py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-[#f7f8ff]">
                <td className="py-3">2026-02-17</td>
                <td className="py-3">Avg Response</td>
                <td className="py-3">1h 23m</td>
                <td className="py-3">Stable</td>
              </tr>
              <tr className="border-b hover:bg-[#f7f8ff]">
                <td className="py-3">2026-02-16</td>
                <td className="py-3">Resolved</td>
                <td className="py-3">12</td>
                <td className="py-3">Peak support load</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrgStaffReports;
