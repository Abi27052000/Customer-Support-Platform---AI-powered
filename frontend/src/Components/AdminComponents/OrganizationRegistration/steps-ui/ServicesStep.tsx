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
                <label key={key} className="inline-flex items-center">
                    <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-indigo-600"
                        checked={services[key]}
                        onChange={(e) => onChange(key, e.target.checked)}
                    />
                    <span className="ml-3 text-sm text-gray-800">
            {key === "aiChat" ? "AI Chat" : key === "aiVoice" ? "AI Voice Agent" : "AI Insights"}
          </span>
                </label>
            ))}
        </div>
    );
};
