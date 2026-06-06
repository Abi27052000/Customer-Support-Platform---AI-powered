import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, MessageSquareText, RefreshCw, Star, Target, TicketCheck } from "lucide-react";
import { staffPerformanceApi, type StaffPerformanceItem, type StaffPerformanceResponse } from "../../../services/staffPerformanceApi";

type ReportTab = "overview" | "performance" | "trends";

const tabs: { key: ReportTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "performance", label: "Performance" },
    { key: "trends", label: "Trends" },
];

const scoreTone = (score: number) => {
    if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (score >= 60) return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-red-50 text-red-700 border-red-100";
};

const formatRating = (value: number | null) => value ? `${value.toFixed(1)}/5` : "No ratings";

const StatCard = ({
    label,
    value,
    description,
}: {
    label: string;
    value: string | number;
    description: string;
}) => (
    <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        <p className="text-xs mt-2 text-gray-500">{description}</p>
    </div>
);

const InsightList = ({ title, items }: { title: string; items: string[] }) => (
    <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
            {(items.length ? items : ["No notable items yet."]).map((item) => (
                <li key={item} className="leading-6">{item}</li>
            ))}
        </ul>
    </div>
);

const StaffDetailCard = ({ staff }: { staff: StaffPerformanceItem }) => (
    <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
                <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{staff.name}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${scoreTone(staff.evaluation.overallScore)}`}>
                        {staff.evaluation.overallScore}
                    </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{staff.email}</p>
                <p className="text-sm text-gray-700 mt-3 max-w-3xl leading-6">{staff.evaluation.summary}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 min-w-full lg:min-w-[420px]">
                {[
                    ["Quality", staff.evaluation.qualityScore],
                    ["Speed", staff.evaluation.speedScore],
                    ["Reliability", staff.evaluation.reliabilityScore],
                    ["Satisfaction", staff.evaluation.customerSatisfactionScore],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-gray-100 p-3">
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="text-lg font-bold text-gray-800">{value}</p>
                    </div>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            <InsightList title="Strengths" items={staff.evaluation.strengths} />
            <InsightList title="Coaching Tips" items={staff.evaluation.coachingTips} />
            <InsightList title="Risk Flags" items={staff.evaluation.riskFlags} />
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-gray-500">Tickets</p>
                <p className="font-semibold text-gray-800">{staff.tickets.resolvedCount}/{staff.tickets.assignedCount} resolved</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-gray-500">Avg Resolution</p>
                <p className="font-semibold text-gray-800">{staff.tickets.averageResolutionLabel}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-gray-500">Live Chats</p>
                <p className="font-semibold text-gray-800">{staff.chats.attributedCount}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-gray-500">Customer Rating</p>
                <p className="font-semibold text-gray-800">{formatRating(staff.ratings.averageRating)}</p>
            </div>
        </div>

        {staff.ratings.recentComments.length > 0 && (
            <div className="mt-5 rounded-lg border border-gray-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Recent Rating Comments</p>
                <div className="mt-2 space-y-2">
                    {staff.ratings.recentComments.map((comment) => (
                        <p key={comment} className="text-sm text-gray-700 leading-6">{comment}</p>
                    ))}
                </div>
            </div>
        )}
    </div>
);

const OrgAdminReports: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ReportTab>("overview");
    const [report, setReport] = useState<StaffPerformanceResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadReport = async () => {
        try {
            setLoading(true);
            const data = await staffPerformanceApi.getReport();
            setReport(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load staff performance");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadReport();
    }, []);

    const topStaff = useMemo(() => report?.staffPerformance.slice(0, 5) || [], [report]);
    const needsAttention = useMemo(
        () => report?.staffPerformance.filter((staff) => staff.evaluation.riskFlags.length > 0).slice(0, 4) || [],
        [report]
    );

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#2D2A8C]">Reports & Analytics</h2>
                    <p className="text-gray-500 mt-1">AI-assisted staff performance across tickets, chats, and customer ratings.</p>
                </div>
                <button
                    onClick={loadReport}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D2A8C] text-white text-sm rounded-lg hover:bg-[#1f1d6d] transition"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === tab.key
                            ? "bg-[#2D2A8C] text-white shadow"
                            : "text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading && <div className="bg-white rounded-xl shadow p-6 text-sm text-gray-500">Loading staff performance...</div>}
            {error && <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-sm text-red-700">{error}</div>}

            {!loading && !error && report && (
                <>
                    {activeTab === "overview" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard label="Staff Evaluated" value={report.summary.totalStaff} description="Active support staff in this organization" />
                                <StatCard label="Resolution Rate" value={`${report.summary.resolutionRate}%`} description={`${report.summary.resolvedTickets} of ${report.summary.totalTickets} assigned tickets resolved`} />
                                <StatCard label="Average AI Score" value={report.summary.averageScore} description="Weighted manager-assistant score" />
                                <StatCard label="Customer Rating" value={formatRating(report.summary.averageRating)} description={`${report.summary.totalStaff} staff members included`} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
                                    <h3 className="font-semibold text-[#2D2A8C] mb-4 flex items-center gap-2">
                                        <Target size={18} />
                                        Top Performers
                                    </h3>
                                    <div className="space-y-3">
                                        {topStaff.length === 0 && <p className="text-sm text-gray-500">No staff performance data yet.</p>}
                                        {topStaff.map((staff, index) => (
                                            <div key={staff.staffId} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-800">{index + 1}. {staff.name}</p>
                                                    <p className="text-xs text-gray-500">{staff.evaluation.summary}</p>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${scoreTone(staff.evaluation.overallScore)}`}>
                                                    {staff.evaluation.overallScore}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
                                    <h3 className="font-semibold text-[#2D2A8C] mb-4 flex items-center gap-2">
                                        <AlertTriangle size={18} />
                                        Coaching Attention
                                    </h3>
                                    <div className="space-y-3">
                                        {needsAttention.length === 0 && <p className="text-sm text-gray-500">No risk flags in the current report.</p>}
                                        {needsAttention.map((staff) => (
                                            <div key={staff.staffId} className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
                                                <p className="font-medium text-gray-800">{staff.name}</p>
                                                <p className="text-sm text-amber-800 mt-1">{staff.evaluation.riskFlags[0]}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "performance" && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
                                <div className="px-5 py-3 border-b">
                                    <h3 className="font-semibold text-[#2D2A8C]">Staff Ranking</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-600">
                                            <tr>
                                                <th className="text-left px-5 py-3 font-medium">Rank</th>
                                                <th className="text-left px-5 py-3 font-medium">Staff Member</th>
                                                <th className="text-left px-5 py-3 font-medium">AI Score</th>
                                                <th className="text-left px-5 py-3 font-medium">Tickets</th>
                                                <th className="text-left px-5 py-3 font-medium">Chats</th>
                                                <th className="text-left px-5 py-3 font-medium">Rating</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {report.staffPerformance.map((staff, index) => (
                                                <tr key={staff.staffId} className="hover:bg-gray-50 transition">
                                                    <td className="px-5 py-3 font-semibold text-gray-700">{index + 1}</td>
                                                    <td className="px-5 py-3">
                                                        <p className="font-medium text-gray-800">{staff.name}</p>
                                                        <p className="text-xs text-gray-500">{staff.email}</p>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${scoreTone(staff.evaluation.overallScore)}`}>
                                                            {staff.evaluation.overallScore}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-gray-600">{staff.tickets.resolvedCount}/{staff.tickets.assignedCount}</td>
                                                    <td className="px-5 py-3 text-gray-600">{staff.chats.attributedCount}</td>
                                                    <td className="px-5 py-3 text-gray-600">{formatRating(staff.ratings.averageRating)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {report.staffPerformance.map((staff) => (
                                <StaffDetailCard key={staff.staffId} staff={staff} />
                            ))}
                        </div>
                    )}

                    {activeTab === "trends" && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
                                <h3 className="font-semibold text-[#2D2A8C] mb-3 flex items-center gap-2">
                                    <TicketCheck size={18} />
                                    Ticket Outcomes
                                </h3>
                                <p className="text-3xl font-bold text-gray-800">{report.summary.resolutionRate}%</p>
                                <p className="text-sm text-gray-500 mt-2">Resolved rate in the current reporting window.</p>
                            </div>
                            <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
                                <h3 className="font-semibold text-[#2D2A8C] mb-3 flex items-center gap-2">
                                    <MessageSquareText size={18} />
                                    Attributed Chats
                                </h3>
                                <p className="text-3xl font-bold text-gray-800">
                                    {report.staffPerformance.reduce((sum, staff) => sum + staff.chats.attributedCount, 0)}
                                </p>
                                <p className="text-sm text-gray-500 mt-2">Saved live chat sessions linked to staff.</p>
                            </div>
                            <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
                                <h3 className="font-semibold text-[#2D2A8C] mb-3 flex items-center gap-2">
                                    <Star size={18} />
                                    Rating Coverage
                                </h3>
                                <p className="text-3xl font-bold text-gray-800">
                                    {report.staffPerformance.reduce((sum, staff) => sum + staff.ratings.count, 0)}
                                </p>
                                <p className="text-sm text-gray-500 mt-2">Post-resolution customer ratings collected.</p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default OrgAdminReports;
