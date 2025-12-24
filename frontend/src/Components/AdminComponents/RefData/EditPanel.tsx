import React from "react";

interface EditPanelProps {
  data: any;
  onClose: () => void;
  onSave: (updated: any) => void;
}

const EditPanel: React.FC<EditPanelProps> = ({ data, onClose, onSave }) => {
  return (
    <div className="fixed right-0 top-0 w-96 h-full bg-white shadow-xl p-4 flex flex-col">
      <h2 className="text-lg font-bold mb-4">Edit Item</h2>

      {Object.keys(data).map((key) => (
        <div key={key} className="mb-3">
          <label className="block text-sm font-semibold">{key}</label>
          <input
            type="text"
            defaultValue={data[key]}
            className="w-full border rounded px-2 py-1"
          />
        </div>
      ))}

      <div className="mt-auto flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
        <button onClick={() => onSave(data)} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
      </div>
    </div>
  );
};

export default EditPanel;
