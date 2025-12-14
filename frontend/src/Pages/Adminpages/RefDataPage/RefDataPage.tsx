import React, { useEffect, useState } from "react";
import { RefDataSidebar } from "../../../Components/AdminComponents/RefData/RefDataSidebar";
import { RefDataTable } from "../../../Components/AdminComponents/RefData/RefDataTable";
import { RightActionBar } from "../../../Components/AdminComponents/RefData/RightActionBar";
import EditPanel from "../../../Components/AdminComponents/RefData/EditPanel";
import type { ReferenceDataRow } from "../../../Components/AdminComponents/RefData/RefDataTable";

const menuItems = [
  { title: "Units", keyName: "units" },
  { title: "Users", keyName: "users" },
  { title: "Roles", keyName: "roles" },
];

const sampleData: ReferenceDataRow[] = [
  { id: "1", name: "Unit One", status: "Active" },
  { id: "2", name: "Unit Two", status: "Inactive" },
];

export const ReferenceDataPage: React.FC = () => {
  // 🔹 Default select FIRST ROW
  const [selectedRow, setSelectedRow] = useState<ReferenceDataRow | null>(
    sampleData[0] ?? null
  );

  const [editItem, setEditItem] = useState<ReferenceDataRow | null>(null);

  useEffect(() => {
    if (!selectedRow && sampleData.length > 0) {
      setSelectedRow(sampleData[0]);
    }
  }, [selectedRow]);

  return (
    <div className="flex relative">
      <RefDataSidebar menuItems={menuItems} />

      <div className="flex-1 p-6 pr-24">
        <h1 className="text-2xl font-bold mb-4">Reference Data</h1>

        <RefDataTable
          data={sampleData}
          selectedRowId={selectedRow?.id}
          onRowSelect={setSelectedRow}
        />
      </div>

      <RightActionBar
        selectedRow={selectedRow}
        onEdit={() => setEditItem(selectedRow)}
        onDelete={() => alert(`Delete ${selectedRow?.name}`)}
      />

      {editItem && (
        <EditPanel
          data={editItem}
          onClose={() => setEditItem(null)}
          onSave={() => setEditItem(null)}
        />
      )}
    </div>
  );
};
