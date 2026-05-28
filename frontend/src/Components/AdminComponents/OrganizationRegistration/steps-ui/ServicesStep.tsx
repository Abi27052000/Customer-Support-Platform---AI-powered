import React from "react";

type Services = {
    aiChat: boolean;
    aiVoice: boolean;
    aiInsights: boolean;
    callTranscription: boolean;
    callSummarization: boolean;
};

type Props = {
    services: Services;
    onChange: <K extends keyof Services>(key: K, value: boolean) => void;
};

export const ServicesStep: React.FC<Props> = ({ services, onChange }) => {
    return (
        <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Which services do you expect?</p>

            {(["aiChat", "aiVoice", "aiInsights", "callTranscription", "callSummarization"] as const).map((key) => (
                <label key={key} className="flex items-start p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors relative overflow-hidden">
                    <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 mt-0.5"
                        checked={services[key]}
                        onChange={(e) => onChange(key, e.target.checked)}
                    />
                    <div className="ml-4 flex-1">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            {key === "aiChat" ? "AI Chat" : 
                             key === "aiVoice" ? "AI Voice Agent" : 
                             key === "aiInsights" ? "AI Insights" :
                             key === "callTranscription" ? "Call Transcription" :
                             "Call Summarization"}
                             
                             {(key === 'callTranscription' || key === 'callSummarization') && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                                    Premium
                                </span>
                             )}
                        </span>
                        <span className="block text-xs text-slate-500 mt-1">
                            {key === "aiChat" ? "Enable automated text-based customer support chat." :
                             key === "aiVoice" ? "Enable AI-driven voice interactions for support." :
                             key === "aiInsights" ? "Get deep data analytics and trends from customer interactions." :
                             key === "callTranscription" ? "Auto-generate highly accurate transcripts of user calls (Requires subscription paid by org)." :
                             "Automatic generation of concise summaries after calls complete (Requires subscription paid by org)."}
                        </span>
                    </div>
                </label>
            ))}
        </div>
    );
};
