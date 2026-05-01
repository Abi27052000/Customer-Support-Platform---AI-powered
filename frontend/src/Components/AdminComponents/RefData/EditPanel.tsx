import React, { useState, useEffect } from "react";

interface EditPanelProps {
  data: any;
  onClose: () => void;
  onSave: (updated: any) => void;
}

const EditPanel: React.FC<EditPanelProps> = ({ data, onClose, onSave }) => {
  const [formData, setFormData] = useState({ ...data });

  useEffect(() => {
    setFormData({ ...data });
  }, [data]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleServiceChange = (serviceKey: string, checked: boolean) => {
    setFormData((prev: any) => ({
      ...prev,
      services: {
        ...prev.services,
        [serviceKey]: checked
      }
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="fixed right-0 top-0 w-96 h-full bg-white shadow-2xl p-6 flex flex-col z-50 animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Edit Details</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">&times;</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {/* ID - Read Only */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ID</label>
          <input
            type="text"
            value={data.id}
            disabled
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-500 font-mono text-sm cursor-not-allowed"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Name</label>
          <input
            type="text"
            value={formData.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
          />
        </div>

        {/* Email/Admin Email */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            {formData.services ? "Admin Email" : "Email"}
          </label>
          <input
            type="email"
            value={formData.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
          />
        </div>

        {/* Services Section if exists */}
        {formData.services && (
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">AI Services</label>
            <div className="space-y-3">
              {Object.keys(formData.services).map((serviceKey) => (
                <label key={serviceKey} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.services[serviceKey]}
                    onChange={(e) => handleServiceChange(serviceKey, e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700 capitalize">
                    {serviceKey.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all active:scale-95"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditPanel;
