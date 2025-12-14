import React from "react";

export interface ReferenceDataRow {
  id: string;
  name: string;
  status: string;
  ids?: string;
  names?: string;
  statuss?: string;
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
  return (
    <table className="w-full bg-white rounded shadow">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 text-left">ID</th>
          <th className="p-2 text-left">Name</th>
          <th className="p-2 text-left">Status</th>
        </tr>
      </thead>

      <tbody>
        {data.map((row) => (
          <tr
            key={row.id}
            onClick={() => onRowSelect(row)}
            className={`cursor-pointer border-t
              ${selectedRowId === row.id ? "bg-blue-50" : "hover:bg-gray-50"}
            `}
          >
            <td className="p-2">{row.id}</td>
            <td className="p-2">{row.name}</td>
            <td className="p-2">{row.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
