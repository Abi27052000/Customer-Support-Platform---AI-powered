import React from "react";

type OrgForm = {
    adminUsername: string;
    adminPassword: string;
};

type Errors = Partial<Record<keyof OrgForm, string>>;

type Props = {
    form: OrgForm;
    errors: Errors;
    onChange: <K extends keyof OrgForm>(key: K, value: OrgForm[K]) => void;
};

export const AdminAccountStep: React.FC<Props> = ({ form, errors, onChange }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Username *
                </label>
                <input
                    className={`px-4 py-3 rounded-lg border w-full focus:outline-none focus:ring-2 ${
                        errors.adminUsername ? "border-red-400" : "border-gray-200"
                    }`}
                    placeholder="admin_user"
                    value={form.adminUsername}
                    onChange={(e) => onChange("adminUsername", e.target.value)}
                />
                {errors.adminUsername && (
                    <div className="text-red-500 text-sm mt-1">{errors.adminUsername}</div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                </label>
                <input
                    type="password"
                    className={`px-4 py-3 rounded-lg border w-full focus:outline-none focus:ring-2 ${
                        errors.adminPassword ? "border-red-400" : "border-gray-200"
                    }`}
                    placeholder="Choose a strong password"
                    value={form.adminPassword}
                    onChange={(e) => onChange("adminPassword", e.target.value)}
                />
                {errors.adminPassword && (
                    <div className="text-red-500 text-sm mt-1">{errors.adminPassword}</div>
                )}
            </div>
        </div>
    );
};
