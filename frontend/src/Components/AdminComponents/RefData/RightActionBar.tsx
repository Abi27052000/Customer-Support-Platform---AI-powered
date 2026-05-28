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
    <div className="w-12 bg-[#1E3A8A] flex flex-col items-center py-6 gap-4 shadow-inner min-h-full border-l border-blue-900/20">
      <button
        onClick={onEdit}
        className="p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all active:scale-90 border border-white/10"
        title="Edit"
      >
        <FaEdit size={18} />
      </button>

      <button
        onClick={onDelete}
        className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all active:scale-90 border border-red-500/20"
        title="Delete"
      >
        <FaTrash size={18} />
      </button>
    </div>
  );
};
