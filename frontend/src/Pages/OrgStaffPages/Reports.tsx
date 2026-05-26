import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../Context/AuthContext";
import { conversationSummaryApi, type ConversationSummary } from "../../services/conversationSummaryApi";

type ReportScope = "unified" | "single";
type ReportType = "summary" | "escalation" | "channel";
type DateFilter = "all" | "7d" | "30d" | "custom";

const OrgStaffReports: React.FC = () => {
  const { user, orgs } = useAuth();
  
  // State variables
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [scope, setScope] = useState<ReportScope>("unified");
  const [reportType, setReportType] = useState<ReportType>("summary");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  
  // Track expanded summary rows in table
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Fetch summaries on component mount
  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        setLoading(true);
        const data = await conversationSummaryApi.listSummaries();
        setConversations(data);
        if (data.length > 0) {
          setSelectedSessionId(data[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load conversation summaries");
      } finally {
        setLoading(false);
      }
    };
    fetchSummaries();
  }, []);

  // Get active organization name
  const currentOrgName = useMemo(() => {
    if (!user?.orgId || !orgs) return "Our Support Team";
    const found = orgs.find((org) => org.id === user.orgId);
    return found ? found.name : "Our Support Team";
  }, [user, orgs]);

  // Stable Report Reference ID
  const reportRefId = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `REP-${today}-${rand}`;
  }, [scope, reportType, dateFilter]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      if (dateFilter === "7d") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return new Date(conv.createdAt) >= sevenDaysAgo;
      }
      if (dateFilter === "30d") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(conv.createdAt) >= thirtyDaysAgo;
      }
      if (dateFilter === "custom") {
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          const convDate = new Date(conv.createdAt);
          return convDate >= start && convDate <= end;
        }
      }
      return true;
    });
  }, [conversations, dateFilter, customStartDate, customEndDate]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = filteredConversations.length;
    if (total === 0) {
      return {
        total: 0,
        chat: 0,
        voice: 0,
        chatPct: 0,
        voicePct: 0,
        escalated: 0,
        escalatedPct: 0,
        cleared: 0,
        clearedPct: 0,
        ended: 0,
        endedPct: 0,
      };
    }
    const chat = filteredConversations.filter((c) => c.channel === "ai_chat").length;
    const voice = filteredConversations.filter((c) => c.channel === "ai_voice").length;
    const escalated = filteredConversations.filter((c) => c.endedReason === "escalated").length;
    const cleared = filteredConversations.filter((c) => c.endedReason === "cleared").length;
    const ended = filteredConversations.filter((c) => c.endedReason === "ended").length;

    return {
      total,
      chat,
      voice,
      chatPct: Math.round((chat / total) * 100),
      voicePct: Math.round((voice / total) * 100),
      escalated,
      escalatedPct: Math.round((escalated / total) * 100),
      cleared,
      clearedPct: Math.round((cleared / total) * 100),
      ended,
      endedPct: Math.round((ended / total) * 100),
    };
  }, [filteredConversations]);

  // Selected session for single view
  const selectedSession = useMemo(() => {
    return conversations.find((c) => c.id === selectedSessionId) || null;
  }, [conversations, selectedSessionId]);

  // Generate Date Range Label
  const dateRangeLabel = useMemo(() => {
    if (dateFilter === "all") return "All Time";
    if (dateFilter === "7d") return "Last 7 Days";
    if (dateFilter === "30d") return "Last 30 Days";
    if (dateFilter === "custom" && customStartDate && customEndDate) {
      return `${customStartDate} to ${customEndDate}`;
    }
    return "Custom Range";
  }, [dateFilter, customStartDate, customEndDate]);

  // Toggle row expansion
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // CSV Exporter
  const handleExportCSV = () => {
    let dataToExport: ConversationSummary[] = [];
    let filename = "";
    const cleanOrg = currentOrgName.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    if (scope === "unified") {
      dataToExport = filteredConversations;
      const cleanRange = dateRangeLabel.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      filename = `Support_Report_${reportType}_${cleanRange}_${cleanOrg}.csv`;
    } else {
      if (selectedSession) {
        dataToExport = [selectedSession];
        const cleanSessionId = selectedSession.sessionId.replace(/[^a-z0-9]/gi, "_");
        filename = `Session_Report_${cleanSessionId}_${cleanOrg}.csv`;
      } else {
        return;
      }
    }

    const headers = [
      "Session ID",
      "Date",
      "Customer Name",
      "Customer Email",
      "Channel",
      "Outcome",
      "Title",
      "Summary",
    ];

    const rows = dataToExport.map((c) => [
      c.sessionId,
      new Date(c.createdAt).toLocaleString(),
      c.customer?.name || "Anonymous",
      c.customer?.email || "N/A",
      c.channel === "ai_chat" ? "AI Chat" : "AI Voice",
      c.endedReason,
      c.title.replace(/"/g, '""'),
      c.summary.replace(/"/g, '""'),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${val}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print handler
  const handlePrint = () => {
    // Generate professional document title for the PDF filename suggestion
    const originalTitle = document.title;
    const cleanOrg = currentOrgName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    
    if (scope === "unified") {
      const cleanRange = dateRangeLabel.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      document.title = `Support_Report_${reportType}_${cleanRange}_${cleanOrg}`;
    } else if (selectedSession) {
      const cleanSessionId = selectedSession.sessionId.replace(/[^a-z0-9]/gi, "_");
      const cleanCustomer = (selectedSession.customer?.name || "Anonymous").replace(/[^a-z0-9]/gi, "_");
      document.title = `Session_Report_${cleanSessionId}_${cleanCustomer}_${cleanOrg}`;
    }
    
    window.print();
    
    // Restore original tab title after a short delay
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Inline CSS to handle clean print layouts
  const printStyles = `
    @media print {
      /* Hide the sidebar */
      div.flex > div.h-screen,
      div.fixed.left-0,
      div[class*="bg-[#2D2A8C]"] {
        display: none !important;
      }
      /* Hide the navbar */
      div.flex > div.flex-1 > div.sticky,
      div.sticky,
      div[class*="h-18"] {
        display: none !important;
      }
      /* Reset the main content wrapper layout: remove margins and paddings */
      div.flex > div.flex-1,
      div[class*="ml-60"],
      div[class*="ml-20"] {
        margin-left: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      /* Reset inner padding container of layout */
      div.flex > div.flex-1 > div.p-8,
      div[class*="p-8"] {
        padding: 0 !important;
        background: white !important;
      }
      body, html {
        background: white !important;
        color: black !important;
        font-size: 12pt !important;
      }
      .no-print {
        display: none !important;
      }
      .print-container {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      .report-card {
        border: 1px solid #e2e8f0 !important;
        box-shadow: none !important;
        background: white !important;
        page-break-inside: avoid;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
      }
      th, td {
        border-bottom: 1px solid #e2e8f0 !important;
        padding: 6px 8px !important;
      }
      .page-break {
        page-break-before: always;
      }
    }
  `;

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-[#2D2A8C] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Loading conversation logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="font-semibold text-red-800 text-lg mb-1">Failed to Load Reports</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <style>{printStyles}</style>

      {/* Control Panel (Hidden on Print) */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 space-y-4 no-print transition-all duration-300 hover:shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#2D2A8C]">Report Configuration</h2>
            <p className="text-xs text-gray-500 mt-1">Configure templates, scope, and filters to generate reports.</p>
          </div>
          
          {/* Scope Selectors */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setScope("unified")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                scope === "unified"
                  ? "bg-[#2D2A8C] text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Unified Report
            </button>
            <button
              onClick={() => setScope("single")}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                scope === "single"
                  ? "bg-[#2D2A8C] text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Single Session Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
          {/* Column 1: Report Type / Session Selector */}
          {scope === "unified" ? (
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Template / Report Focus</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D2A8C]/20 focus:border-[#2D2A8C] bg-white"
              >
                <option value="summary">General Support Summary</option>
                <option value="escalation">Escalation & Resolution Audit</option>
                <option value="channel">AI Channel Performance</option>
              </select>
            </div>
          ) : (
            <div className="flex flex-col space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-gray-600">Select Conversation Session</label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D2A8C]/20 focus:border-[#2D2A8C] bg-white"
              >
                {conversations.length === 0 ? (
                  <option value="">No sessions available</option>
                ) : (
                  conversations.map((c) => (
                    <option key={c.id} value={c.id}>
                      {new Date(c.createdAt).toLocaleDateString()} — {c.customer?.name || "Anonymous"} ({c.title.slice(0, 30)}...)
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Column 2: Date Filters (only for Unified) */}
          {scope === "unified" && (
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Time Range</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D2A8C]/20 focus:border-[#2D2A8C] bg-white"
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          )}

          {/* Column 3: Custom Date Ranges (conditional) */}
          {scope === "unified" && dateFilter === "custom" && (
            <div className="flex items-center gap-2 md:col-span-1">
              <div className="flex-1 flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="border rounded-lg p-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-[#2D2A8C]"
                />
              </div>
              <div className="flex-1 flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="border rounded-lg p-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-[#2D2A8C]"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Action buttons inside configuration card */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={handleExportCSV}
            disabled={scope === "single" ? !selectedSession : filteredConversations.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-[#2D2A8C] text-white rounded-lg text-sm font-semibold hover:bg-[#1F1C6A] transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* MAIN DOCUMENT SHEET (Common Printable Template) */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12 print-container transition-all duration-300">
        
        {/* Document Header */}
        <div className="border-b-2 border-[#2D2A8C] pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-[#2D2A8C]/10 text-[#2D2A8C] text-[10px] tracking-widest font-extrabold uppercase px-2 py-0.5 rounded">
                Official Report
              </span>
              <span className="text-gray-400 text-xs font-mono">#{reportRefId}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#2D2A8C] tracking-tight">
              {scope === "unified"
                ? reportType === "summary"
                  ? "General Support Summary Report"
                  : reportType === "escalation"
                  ? "Escalation & Resolution Audit"
                  : "AI Channel Performance Report"
                : "Customer Conversation Session Report"}
            </h1>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{currentOrgName}</p>
          </div>
          
          {/* Metadata details */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col space-y-1 w-full md:w-auto">
            <div>
              <span className="font-semibold text-gray-700">Date Generated:</span> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </div>
            <div>
              <span className="font-semibold text-gray-700">Target Range:</span> {scope === "unified" ? dateRangeLabel : "Single Session"}
            </div>
            <div>
              <span className="font-semibold text-gray-700">Generated By:</span> {user?.name || "Support Staff"} ({user?.email || "N/A"})
            </div>
          </div>
        </div>

        {/* Executive Summary Section */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50/50 to-violet-50/30 rounded-xl border border-indigo-100/50 p-5 report-card">
          <h3 className="text-sm font-bold text-[#2D2A8C] uppercase tracking-wider mb-2">Executive Summary</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {scope === "unified" ? (
              filteredConversations.length > 0 ? (
                `This report summarizes AI-driven customer support conversations handled on behalf of ${currentOrgName} during the ${dateRangeLabel} timeframe. A total of ${metrics.total} conversations were recorded, with ${metrics.chat} chats (${metrics.chatPct}%) and ${metrics.voice} voice sessions (${metrics.voicePct}%). Over this duration, ${metrics.cleared} issues (${metrics.clearedPct}%) were successfully cleared/resolved directly by the AI, ${metrics.ended} sessions ended normally (${metrics.endedPct}%), and ${metrics.escalated} sessions (${metrics.escalatedPct}%) required live escalation to human support agents.`
              ) : (
                `No support interactions were recorded for ${currentOrgName} during the specified timeframe (${dateRangeLabel}). Adjust the configuration filters above to analyze data.`
              )
            ) : selectedSession ? (
              `This document reports on a single customer support session (#${selectedSession.sessionId}) held on ${new Date(selectedSession.createdAt).toLocaleDateString()} at ${new Date(selectedSession.createdAt).toLocaleTimeString()}. The customer, ${selectedSession.customer?.name || "Anonymous"} (${selectedSession.customer?.email || "N/A"}), initiated communication through the ${selectedSession.channel === "ai_chat" ? "AI Chat" : "AI Voice"} channel. The interaction lasted until it was closed with the outcome status of "${selectedSession.endedReason}".`
            ) : (
              "No session has been selected for this report. Use the dropdown in the configuration panel to select an active session."
            )}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-150 rounded-xl p-5 shadow-sm report-card flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Sessions</span>
            <span className="text-3xl font-extrabold text-[#2D2A8C] mt-2">
              {scope === "unified" ? metrics.total : selectedSession ? 1 : 0}
            </span>
            <span className="text-[10px] text-gray-400 mt-1">Logged logs</span>
          </div>

          <div className="bg-white border border-gray-150 rounded-xl p-5 shadow-sm report-card flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Chat volume</span>
            <span className="text-3xl font-extrabold text-[#2D2A8C] mt-2">
              {scope === "unified" ? metrics.chat : selectedSession?.channel === "ai_chat" ? 1 : 0}
            </span>
            <span className="text-[10px] text-gray-400 mt-1">
              {scope === "unified" ? `${metrics.chatPct}% of total` : selectedSession?.channel === "ai_chat" ? "100%" : "0%"}
            </span>
          </div>

          <div className="bg-white border border-gray-150 rounded-xl p-5 shadow-sm report-card flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Voice volume</span>
            <span className="text-3xl font-extrabold text-[#2D2A8C] mt-2">
              {scope === "unified" ? metrics.voice : selectedSession?.channel === "ai_voice" ? 1 : 0}
            </span>
            <span className="text-[10px] text-gray-400 mt-1">
              {scope === "unified" ? `${metrics.voicePct}% of total` : selectedSession?.channel === "ai_voice" ? "100%" : "0%"}
            </span>
          </div>

          <div className="bg-white border border-gray-150 rounded-xl p-5 shadow-sm report-card flex flex-col justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {scope === "unified" ? "Escalation Rate" : "Session Outcome"}
            </span>
            <span className={`text-xl font-extrabold mt-2 uppercase ${
              scope === "unified" 
                ? metrics.escalatedPct > 30 ? "text-amber-600" : "text-[#2D2A8C]"
                : selectedSession?.endedReason === "escalated" 
                  ? "text-amber-600" 
                  : "text-emerald-600"
            }`}>
              {scope === "unified" 
                ? `${metrics.escalatedPct}%` 
                : selectedSession 
                  ? selectedSession.endedReason 
                  : "N/A"}
            </span>
            <span className="text-[10px] text-gray-400 mt-1">
              {scope === "unified" 
                ? `${metrics.escalated} escalated cases` 
                : selectedSession?.endedReason === "escalated" 
                  ? "Escalated to human staff" 
                  : "Resolved without human intervention"}
            </span>
          </div>
        </div>

        {/* Unified Report Specific Visual Graphs & Table */}
        {scope === "unified" && filteredConversations.length > 0 && (
          <div className="mt-8 space-y-8">
            
            {/* Visual Insights Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Channel Distribution Chart */}
              <div className="border border-gray-150 rounded-xl p-5 report-card space-y-4">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Channel Distribution</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-gray-600">
                    <span>AI Chat ({metrics.chat} sessions)</span>
                    <span>AI Voice ({metrics.voice} sessions)</span>
                  </div>
                  
                  {/* Visual Bar */}
                  <div className="h-6 w-full bg-gray-100 rounded-full overflow-hidden flex">
                    <div 
                      style={{ width: `${metrics.chatPct}%` }}
                      className="bg-[#2D2A8C] h-full flex items-center justify-center text-[10px] text-white font-bold transition-all duration-500"
                    >
                      {metrics.chatPct > 10 ? `${metrics.chatPct}%` : ""}
                    </div>
                    <div 
                      style={{ width: `${metrics.voicePct}%` }}
                      className="bg-indigo-300 h-full flex items-center justify-center text-[10px] text-gray-800 font-bold transition-all duration-500"
                    >
                      {metrics.voicePct > 10 ? `${metrics.voicePct}%` : ""}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 pt-1 text-[10px] text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#2D2A8C]"></span>
                    <span>Web/App Text Chat</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-indigo-300"></span>
                    <span>Phone/Voice Bot</span>
                  </div>
                </div>
              </div>

              {/* Outcomes breakdown */}
              <div className="border border-gray-150 rounded-xl p-5 report-card space-y-4">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Conversation Outcomes</h4>
                <div className="space-y-3">
                  {/* Escalated */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-gray-700">Escalated to Agent</span>
                      <span className="font-bold text-gray-700">{metrics.escalated} ({metrics.escalatedPct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${metrics.escalatedPct}%` }} 
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      ></div>
                    </div>
                  </div>
                  
                  {/* Cleared */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-gray-700">Resolved & Cleared by AI</span>
                      <span className="font-bold text-gray-700">{metrics.cleared} ({metrics.clearedPct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${metrics.clearedPct}%` }} 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      ></div>
                    </div>
                  </div>

                  {/* Ended Normally */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-gray-700">Ended Normally</span>
                      <span className="font-bold text-gray-700">{metrics.ended} ({metrics.endedPct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${metrics.endedPct}%` }} 
                        className="bg-[#2D2A8C] h-full rounded-full transition-all duration-500"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Detailed logs table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Detailed Conversation Logs</h4>
                <span className="text-xs text-gray-500 font-medium">Showing {filteredConversations.length} records</span>
              </div>

              <div className="overflow-x-auto border border-gray-150 rounded-xl report-card">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-150 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Session ID / Date</th>
                      <th className="px-5 py-3.5">Customer</th>
                      <th className="px-5 py-3.5">Channel</th>
                      <th className="px-5 py-3.5">Outcome</th>
                      <th className="px-5 py-3.5">AI summary Title</th>
                      <th className="px-5 py-3.5 text-right no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {filteredConversations.map((item) => (
                      <React.Fragment key={item.id}>
                        <tr className="hover:bg-indigo-50/20 transition duration-150">
                          <td className="px-5 py-4">
                            <div className="font-mono text-xs font-semibold text-gray-800">{item.sessionId}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-medium text-gray-900">{item.customer?.name || "Anonymous"}</div>
                            <div className="text-[11px] text-gray-500">{item.customer?.email || "N/A"}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.channel === "ai_chat" 
                                ? "bg-blue-50 text-blue-700 border border-blue-200" 
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}>
                              {item.channel === "ai_chat" ? "AI Chat" : "AI Voice"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.endedReason === "escalated"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : item.endedReason === "cleared"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-gray-50 text-gray-700 border border-gray-200"
                            }`}>
                              {item.endedReason}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-700 font-medium text-xs">
                            {item.title}
                          </td>
                          <td className="px-5 py-4 text-right no-print">
                            <button
                              onClick={() => toggleRow(item.id)}
                              className="text-xs font-semibold text-[#2D2A8C] hover:text-[#1F1C6A] underline focus:outline-none"
                            >
                              {expandedRows[item.id] ? "Hide Details" : "View Details"}
                            </button>
                          </td>
                        </tr>
                        {/* Expanded details row */}
                        {expandedRows[item.id] && (
                          <tr className="bg-gray-50/50">
                            <td colSpan={6} className="px-8 py-5 border-b border-gray-200">
                              <div className="space-y-2">
                                <div className="text-xs font-bold text-[#2D2A8C] uppercase tracking-wider">AI Generated Summary Text:</div>
                                <div className="text-sm text-gray-700 bg-white border border-gray-200 p-4 rounded-lg leading-relaxed whitespace-pre-line shadow-inner">
                                  {item.summary}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Single Session Report Specific Full Text Summary */}
        {scope === "single" && (
          <div className="mt-8 space-y-8">
            
            {/* Session Metadata details cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="border border-gray-150 rounded-xl p-5 report-card space-y-3 bg-white shadow-sm">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer Information</h4>
                {selectedSession ? (
                  <div className="space-y-2 pt-1">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 block">Name</span>
                      <span className="text-sm font-bold text-gray-800">{selectedSession.customer?.name || "Anonymous"}</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 block">Email Address</span>
                      <span className="text-sm font-semibold text-gray-700">{selectedSession.customer?.email || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 block">Customer ID</span>
                      <span className="text-xs font-mono text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{selectedSession.customer?.id || "N/A"}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No session selected</p>
                )}
              </div>

              <div className="border border-gray-150 rounded-xl p-5 report-card space-y-3 bg-white shadow-sm">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Session Details</h4>
                {selectedSession ? (
                  <div className="space-y-2 pt-1">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 block">Session ID / Unique Token</span>
                      <span className="text-xs font-mono font-bold text-[#2D2A8C]">{selectedSession.sessionId}</span>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <span className="text-xs font-semibold text-gray-500 block">Channel Type</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${
                          selectedSession.channel === "ai_chat" 
                            ? "bg-blue-50 text-blue-700 border border-blue-200" 
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}>
                          {selectedSession.channel === "ai_chat" ? "AI Chat" : "AI Voice"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-500 block">Outcome Status</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${
                          selectedSession.endedReason === "escalated"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : selectedSession.endedReason === "cleared"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-50 text-gray-700 border border-gray-200"
                        }`}>
                          {selectedSession.endedReason}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 block">Session Timestamp</span>
                      <span className="text-xs font-medium text-gray-700">
                        {new Date(selectedSession.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No session selected</p>
                )}
              </div>

            </div>

            {/* Complete Full Text Summary box */}
            {selectedSession && (
              <div className="border border-gray-150 rounded-xl p-6 report-card bg-white shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">AI Conversation Summary</span>
                    <h3 className="text-base font-bold text-[#2D2A8C]">{selectedSession.title}</h3>
                  </div>
                  
                  {/* Quote icon */}
                  <svg className="w-8 h-8 text-indigo-100" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.748-9.762 9-10.161v3.408c-3.148.18-4.768 1.687-4.858 4.512h4.858v9.632h-9zm-14 0v-7.391c0-5.704 3.748-9.762 9-10.161v3.408c-3.148.18-4.768 1.687-4.858 4.512h4.858v9.632h-9z" />
                  </svg>
                </div>

                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {selectedSession.summary}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Empty States */}
        {scope === "unified" && filteredConversations.length === 0 && (
          <div className="mt-12 text-center p-8 border border-dashed border-gray-300 rounded-xl report-card">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-sm font-medium">No conversation entries match your filter options.</p>
          </div>
        )}
        
        {scope === "single" && !selectedSession && (
          <div className="mt-12 text-center p-8 border border-dashed border-gray-300 rounded-xl report-card">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-gray-500 text-sm font-medium">Please select a valid conversation session from the configuration panel.</p>
          </div>
        )}

        {/* Footer (Common Template) */}
        <div className="mt-12 pt-6 border-t border-gray-150 text-center text-[10px] text-gray-400 uppercase tracking-widest font-semibold flex flex-col md:flex-row justify-between items-center gap-3">
          <span>{currentOrgName} — Customer Support Services</span>
          <span className="no-print font-mono">Confidential | Internal Use Only</span>
          <span>Powered by Antigravity AI Engine</span>
        </div>

      </div>

    </div>
  );
};

export default OrgStaffReports;
