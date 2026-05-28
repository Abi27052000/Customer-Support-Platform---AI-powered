import React from "react";

export interface ReferenceDataRow {
  id: string;
  name: string;
  status: string;
  email?: string;
  services?: {
    aiChat: boolean;
    aiVoice: boolean;
    aiInsights: boolean;
  };
}

interface RefDataTableProps {
  data: ReferenceDataRow[];
  selectedRowId?: string;
  onRowSelect: (row: ReferenceDataRow) => void;
}

export const RefDataTable: React.FC<RefDataTableProps> = ({
  data,
  selectedRowId,
  onRowSelect,
}) => {
  const hasServices = data.some(row => row.services);
  const hasEmails = data.some(row => row.email);

  return (
    <table className="w-full bg-white text-sm">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          <th className="px-4 py-3 text-left font-semibold text-slate-700">ID</th>
          <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
          {hasEmails && <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>}
          {hasServices && <th className="px-4 py-3 text-left font-semibold text-slate-700">Services</th>}
          <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-100">
        {data.map((row) => {
          const isSelected = selectedRowId === row.id;

          const activeServices = row.services ? [
            row.services.aiChat && "AI Chat",
            row.services.aiVoice && "AI Voice",
            row.services.aiInsights && "AI Insights"
          ].filter(Boolean).join(", ") : null;

          return (
            <tr
              key={row.id}
              onClick={() => onRowSelect(row)}
              className={`cursor-pointer transition-colors
                ${isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50"}
              `}
            >
              <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                #{row.id.slice(-6).toUpperCase()}
              </td>
              <td className="px-4 py-3.5 font-medium text-slate-900">{row.name}</td>
              {hasEmails && (
                <td className="px-4 py-3.5 text-slate-500">{row.email || "—"}</td>
              )}
              {hasServices && (
                <td className="px-4 py-3.5">
                  <span className="text-slate-600 truncate max-w-[200px] block">
                    {activeServices || "None"}
                  </span>
                </td>
              )}
              <td className="px-4 py-3.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.status === "Active"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
                  }`}>
                  {row.status}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
