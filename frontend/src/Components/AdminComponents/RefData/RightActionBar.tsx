import React from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import type { ReferenceDataRow } from "./RefDataTable";

interface RightActionBarProps {
  selectedRow: ReferenceDataRow | null;
  onEdit: () => void;
  onDelete: () => void;
}

export const RightActionBar: React.FC<RightActionBarProps> = ({
  selectedRow,
  onEdit,
  onDelete,
}) => {
  if (!selectedRow) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-8 bg-[#1E3A8A] flex flex-col items-center py-6 gap-4 shadow-xl">
      <button
        onClick={onEdit}
        className="p-1 bg-white rounded-lg text-blue-600 hover:bg-blue-100"
        title="Edit"
      >
        <FaEdit />
      </button>

      <button
        onClick={onDelete}
        className="p-1 bg-white rounded-lg text-red-600 hover:bg-red-100"
        title="Delete"
      >
        <FaTrash />
      </button>
    </div>
  );
};
