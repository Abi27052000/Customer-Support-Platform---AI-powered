import React from "react";

type OrgForm = {
    orgName: string;
    addressLine1: string;
    adminUsername: string;
    adminPassword: string;
    services: {
        aiChat: boolean;
        aiVoice: boolean;
        aiInsights: boolean;
    };
};

type Props = {
    form: OrgForm;
};

export const ReviewStep: React.FC<Props> = ({ form }) => {
    return (
        <div className="grid grid-cols-2 gap-6">
            <div>
                <p className="text-sm text-gray-500">Organization</p>
                <p className="font-semibold text-lg">{form.orgName || "-"}</p>
                <p className="text-sm text-gray-500">{form.addressLine1 || "-"}</p>
            </div>

            <div>
                <p className="text-sm text-gray-500">Admin Account</p>
                <p className="font-semibold text-lg">{form.adminUsername || "-"}</p>
                <p className="text-sm text-gray-500">Password: {form.adminPassword ? "••••••••" : "-"}</p>
            </div>

            <div className="col-span-2">
                <p className="text-sm text-gray-500">Requested Services</p>
                <p className="font-semibold text-lg">
                    {[
                        form.services.aiChat ? "AI Chat" : null,
                        form.services.aiVoice ? "AI Voice Agent" : null,
                        form.services.aiInsights ? "AI Insights" : null,
                    ].filter(Boolean).join(", ") || "-"}
                </p>
            </div>
        </div>
    );
};
