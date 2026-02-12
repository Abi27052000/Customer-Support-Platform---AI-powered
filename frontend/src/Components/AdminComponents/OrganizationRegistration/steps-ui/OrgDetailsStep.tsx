import React from "react";

type OrgForm = {
    orgName: string;
    addressLine1: string;
};

type Errors = Partial<Record<keyof OrgForm, string>>;

type Props = {
    form: OrgForm & { city?: string; state?: string; zip?: string }; // optional extra fields
    errors: Errors;
    onChange: <K extends keyof OrgForm>(key: K, value: OrgForm[K]) => void;
};

export const OrgDetailsStep: React.FC<Props> = ({ form, errors, onChange }) => {
    return (
        <div className="grid grid-cols-1 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name *
                </label>
                <input
                    className={`px-4 py-3 rounded-lg border w-full focus:outline-none focus:ring-2 ${
                        errors.orgName ? "border-red-400" : "border-gray-200"
                    }`}
                    placeholder="Acme Corp"
                    value={form.orgName}
                    onChange={(e) => onChange("orgName", e.target.value)}
                />
                {errors.orgName && (
                    <div className="text-red-500 text-sm mt-1">{errors.orgName}</div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1 *
                </label>
                <input
                    className={`px-4 py-3 rounded-lg border w-full focus:outline-none focus:ring-2 ${
                        errors.addressLine1 ? "border-red-400" : "border-gray-200"
                    }`}
                    placeholder="123 Main St"
                    value={form.addressLine1}
                    onChange={(e) => onChange("addressLine1", e.target.value)}
                />
                {errors.addressLine1 && (
                    <div className="text-red-500 text-sm mt-1">{errors.addressLine1}</div>
                )}
            </div>
        </div>
    );
};
