import React from "react";

type Services = {
    aiChat: boolean;
    aiVoice: boolean;
    aiInsights: boolean;
};

type Props = {
    services: Services;
    onChange: <K extends keyof Services>(key: K, value: boolean) => void;
};

export const ServicesStep: React.FC<Props> = ({ services, onChange }) => {
    return (
        <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Which services do you expect?</p>

            {(["aiChat", "aiVoice", "aiInsights"] as const).map((key) => (
                <label key={key} className="flex items-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        checked={services[key]}
                        onChange={(e) => onChange(key, e.target.checked)}
                    />
                    <div className="ml-4">
                        <span className="block text-sm font-semibold text-slate-800">
                            {key === "aiChat" ? "AI Chat" : key === "aiVoice" ? "AI Voice Agent" : "AI Insights"}
                        </span>
                        <span className="block text-xs text-slate-500">
                            {key === "aiChat" ? "Enable automated text-based customer support chat." :
                                key === "aiVoice" ? "Enable AI-driven voice interactions for support." :
                                    "Get deep data analytics and trends from customer interactions."}
                        </span>
                    </div>
                </label>
            ))}
        </div>
    );
};
