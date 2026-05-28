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
        callTranscription: boolean;
        callSummarization: boolean;
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
                <p className="text-sm text-gray-500 mb-2">Requested Services</p>
                <div className="flex flex-wrap gap-2">
                    {form.services.aiChat && (
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">AI Chat</span>
                    )}
                    {form.services.aiVoice && (
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">AI Voice Agent</span>
                    )}
                    {form.services.aiInsights && (
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">AI Insights</span>
                    )}
                    {form.services.callTranscription && (
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-sm font-bold flex items-center gap-1">
                            Call Transcription <span className="text-[10px] uppercase tracking-wider pl-1 opacity-70">Premium</span>
                        </span>
                    )}
                    {form.services.callSummarization && (
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-sm font-bold flex items-center gap-1">
                            Call Summarization <span className="text-[10px] uppercase tracking-wider pl-1 opacity-70">Premium</span>
                        </span>
                    )}
                    {!Object.values(form.services).some(Boolean) && (
                        <span className="text-gray-400 font-medium">- None Selected -</span>
                    )}
                </div>
            </div>
        </div>
    );
};
