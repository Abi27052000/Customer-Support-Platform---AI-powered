import React from "react";

const statCards = [
    { title: "Total Staff", value: 24, description: "Active members in your organization", color: "bg-indigo-50 text-indigo-700" },
    { title: "Open Tickets", value: 38, description: "Unresolved support tickets", color: "bg-amber-50 text-amber-700" },
    { title: "Avg Response Time", value: "1h 12m", description: "Across all staff this week", color: "bg-emerald-50 text-emerald-700" },
    { title: "Customer Satisfaction", value: "94%", description: "Based on recent feedback", color: "bg-violet-50 text-violet-700" },
];

const recentActivity = [
    { action: "New staff member added", detail: "Priya Sharma — Support Agent", time: "10 min ago" },
    { action: "Ticket escalated", detail: "#T-2045 — Billing dispute", time: "25 min ago" },
    { action: "Template updated", detail: "Refund Acknowledgement template", time: "1h ago" },
    { action: "Report generated", detail: "Weekly performance report", time: "3h ago" },
    { action: "Role permissions changed", detail: "Senior Agent role updated", time: "5h ago" },
];

const OrgAdminDashboard: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-[#2D2A8C]">Organization Dashboard</h2>
                <p className="text-gray-500 mt-1">Overview of your organization's support operations.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <div key={card.title} className={`rounded-xl shadow p-5 ${card.color}`}>
                        <p className="text-sm font-medium opacity-80">{card.title}</p>
                        <p className="text-3xl font-bold mt-1">{card.value}</p>
                        <p className="text-xs mt-2 opacity-70">{card.description}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow p-5">
                    <h3 className="font-semibold text-[#2D2A8C] mb-4">Recent Activity</h3>
                    <div className="divide-y">
                        {recentActivity.map((item, i) => (
                            <div key={i} className="py-3 flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{item.action}</p>
                                    <p className="text-xs text-gray-500">{item.detail}</p>
                                </div>
                                <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow p-5">
                    <h3 className="font-semibold text-[#2D2A8C] mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                        {["Add New Staff", "Create Template", "Generate Report", "Manage Roles", "View All Tickets"].map((label) => (
                            <button
                                key={label}
                                className="w-full text-left px-4 py-2.5 border rounded-lg text-sm hover:bg-[#f3f4ff] hover:border-[#2D2A8C]/30 transition"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrgAdminDashboard;
