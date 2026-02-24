import React, { useState } from "react";

type ReportTab = "overview" | "performance" | "trends";

const summaryStats = [
    { label: "Total Tickets", value: "1,247", change: "+12%", positive: true },
    { label: "Resolution Rate", value: "87%", change: "+3%", positive: true },
    { label: "Avg Handle Time", value: "8m 42s", change: "-15%", positive: true },
    { label: "Customer Satisfaction", value: "4.6/5", change: "-0.1", positive: false },
];

const topPerformers = [
    { name: "Anita Desai", resolved: 142, avgTime: "6m 15s", satisfaction: "4.8" },
    { name: "Priya Sharma", resolved: 128, avgTime: "7m 30s", satisfaction: "4.7" },
    { name: "Vikram Singh", resolved: 115, avgTime: "8m 05s", satisfaction: "4.6" },
    { name: "Meera Patel", resolved: 98, avgTime: "9m 20s", satisfaction: "4.5" },
    { name: "Rahul Verma", resolved: 87, avgTime: "10m 10s", satisfaction: "4.4" },
];

const trendData = [
    { period: "This Week", tickets: 189, resolved: 164, pending: 25 },
    { period: "Last Week", tickets: 175, resolved: 160, pending: 15 },
    { period: "2 Weeks Ago", tickets: 198, resolved: 185, pending: 13 },
    { period: "3 Weeks Ago", tickets: 162, resolved: 155, pending: 7 },
    { period: "4 Weeks Ago", tickets: 145, resolved: 140, pending: 5 },
];

const tabs: { key: ReportTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "performance", label: "Performance" },
    { key: "trends", label: "Trends" },
];

const OrgAdminReports: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ReportTab>("overview");

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[#2D2A8C]">Reports & Analytics</h2>
                    <p className="text-gray-500 mt-1">Track your organization's support performance and trends.</p>
                </div>
                <button className="px-4 py-2 bg-[#2D2A8C] text-white text-sm rounded-lg hover:bg-[#1f1d6d] transition">
                    Export Report
                </button>
            </div>

            {/* Tabs */}
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

            {/* Overview Tab */}
            {activeTab === "overview" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {summaryStats.map((stat) => (
                            <div key={stat.label} className="bg-white rounded-xl shadow p-5">
                                <p className="text-sm text-gray-500">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                                <p className={`text-xs mt-2 font-medium ${stat.positive ? "text-emerald-600" : "text-red-500"}`}>
                                    {stat.change} vs last month
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-xl shadow p-5">
                        <h3 className="font-semibold text-[#2D2A8C] mb-3">Ticket Volume Chart</h3>
                        <div className="h-48 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                            📊 Chart visualization will be displayed here
                        </div>
                    </div>
                </div>
            )}

            {/* Performance Tab */}
            {activeTab === "performance" && (
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="px-5 py-3 border-b">
                        <h3 className="font-semibold text-[#2D2A8C]">Top Performers — This Month</h3>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="text-left px-5 py-3 font-medium">Rank</th>
                                <th className="text-left px-5 py-3 font-medium">Staff Member</th>
                                <th className="text-left px-5 py-3 font-medium">Tickets Resolved</th>
                                <th className="text-left px-5 py-3 font-medium">Avg Handle Time</th>
                                <th className="text-left px-5 py-3 font-medium">Satisfaction</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {topPerformers.map((p, i) => (
                                <tr key={p.name} className="hover:bg-gray-50 transition">
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-200 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-400"
                                            }`}>
                                            {i + 1}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 font-medium text-gray-800">{p.name}</td>
                                    <td className="px-5 py-3 text-gray-600">{p.resolved}</td>
                                    <td className="px-5 py-3 text-gray-600">{p.avgTime}</td>
                                    <td className="px-5 py-3">
                                        <span className="text-emerald-600 font-medium">⭐ {p.satisfaction}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Trends Tab */}
            {activeTab === "trends" && (
                <div className="space-y-4">
                    <div className="bg-white rounded-xl shadow p-5">
                        <h3 className="font-semibold text-[#2D2A8C] mb-3">Ticket Trends — Last 5 Weeks</h3>
                        <div className="h-48 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg flex items-center justify-center text-gray-400 text-sm mb-4">
                            📈 Trend chart visualization will be displayed here
                        </div>

                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="text-left px-5 py-3 font-medium">Period</th>
                                    <th className="text-left px-5 py-3 font-medium">Total Tickets</th>
                                    <th className="text-left px-5 py-3 font-medium">Resolved</th>
                                    <th className="text-left px-5 py-3 font-medium">Pending</th>
                                    <th className="text-left px-5 py-3 font-medium">Resolution %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {trendData.map((row) => (
                                    <tr key={row.period} className="hover:bg-gray-50 transition">
                                        <td className="px-5 py-3 font-medium text-gray-800">{row.period}</td>
                                        <td className="px-5 py-3 text-gray-600">{row.tickets}</td>
                                        <td className="px-5 py-3 text-emerald-600 font-medium">{row.resolved}</td>
                                        <td className="px-5 py-3 text-amber-600">{row.pending}</td>
                                        <td className="px-5 py-3 text-gray-600">{Math.round((row.resolved / row.tickets) * 100)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrgAdminReports;
