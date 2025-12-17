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
      {data.map((row, index) => {
        const isSelected = selectedRowId === row.id;
        const isEvenRow = index % 2 === 1;

        return (
            <tr
                key={row.id}
                onClick={() => onRowSelect(row)}
                className={`cursor-pointer border-t
          ${
                    isSelected
                        ? "bg-blue-50"
                        : isEvenRow
                            ? "bg-gray-50"
                            : "bg-white"
                }
          hover:bg-gray-100
        `}
            >
              <td className="p-2">{row.id}</td>
              <td className="p-2">{row.name}</td>
              <td className="p-2">{row.status}</td>
            </tr>
        );
      })}
      </tbody>

    </table>
  );
};
