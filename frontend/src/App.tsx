import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./Components/UserComponents/Layout/UserLayout";
import Dashboard from "../src/Pages/UserPages/Dashboard/Dashboard";
import Settings from "./Pages/UserPages/Settings/Settings"
import AdminLayout from "./Components/AdminComponents/Layout/AdminLayout";
import Reports from "./Pages/UserPages/Reports/Reports";
import FeedbackPage from "./Pages/UserPages/Feedback/FeedbackPage";
import { ReferenceDataPage } from "./Pages/Adminpages/RefDataPage/RefDataPage";
import { OrganizationRegistration } from "./Pages/Adminpages/OrganizationRegistration/OrganizationRegistration";
import AdminSettings from "./Pages/Adminpages/Settings/AdminSettings";
import { AITextPage } from "./Pages/UserPages/AITextChat/AITextChat";
import { AIVoiceChat } from "./Pages/UserPages/AIVoiceChat/AIVoiceChat";
import { AISummary } from "./Pages/UserPages/AISummary/AISummary";
import Register from "./Pages/Register.tsx";
import Login from "./Pages/Login.tsx";
import OrgPicker from "./Pages/OrgPicker.tsx";
import ProtectedRoute from "./Components/Auth/ProtectedRoute";

// Org Staff pages
import OrgStaffDashboard from "./Pages/OrgStaffPages/Dashboard";
import OrgStaffProfile from "./Pages/OrgStaffPages/Profile";
import OrgStaffReports from "./Pages/OrgStaffPages/Reports";
import OrgStaffSettings from "./Pages/OrgStaffPages/Settings";
import OrgStaffConversations from "./Pages/OrgStaffPages/Conversations";
import { TextEmotionPage } from "./Pages/UserPages/TextEmotion/TextEmotionPage";

// Org Admin pages
import OrgAdminLayout from "./Components/OrgAdminComponents/Layout/OrgAdminLayout";
import OrgAdminDashboard from "./Pages/OrgAdminPages/Dashboard/Dashboard";
import OrgAdminRefData from "./Pages/OrgAdminPages/RefData/RefDataPage";
import OrgAdminStaffManagement from "./Pages/OrgAdminPages/StaffManagement/StaffManagement";
import OrgAdminReports from "./Pages/OrgAdminPages/Reports/ReportsAnalytics";
import OrgAdminSettings from "./Pages/OrgAdminPages/Settings/OrgAdminSettings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/org-picker" element={<OrgPicker />} />
        </Route>

        {/* USER ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['user']} />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="AI-chat" element={<AITextPage />} />
            <Route path="AI-voice" element={<AIVoiceChat />} />
            <Route path="AI-summary" element={<AISummary />} />
            <Route path="text-emotion" element={<TextEmotionPage />} />
            <Route path="reports" element={<Reports />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        {/* ORG STAFF ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['organization_staff']} />}>
          <Route path="/staff" element={<MainLayout />}>
            <Route index element={<OrgStaffDashboard />} />
            <Route path="dashboard" element={<OrgStaffDashboard />} />
            <Route path="conversations" element={<OrgStaffConversations />} />
            <Route path="profile" element={<OrgStaffProfile />} />
            <Route path="reports" element={<OrgStaffReports />} />
            <Route path="settings" element={<OrgStaffSettings />} />
          </Route>
        </Route>

        {/* ORG ADMIN ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['organization_admin']} />}>
          <Route path="/org-admin" element={<OrgAdminLayout />}>
            <Route index element={<OrgAdminDashboard />} />
            <Route path="ref-data" element={<OrgAdminRefData />} />
            <Route path="staff" element={<OrgAdminStaffManagement />} />
            <Route path="reports" element={<OrgAdminReports />} />
            <Route path="settings" element={<OrgAdminSettings />} />
          </Route>
        </Route>

        {/* ADMIN ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="ref-data" element={<ReferenceDataPage />} />
            <Route path="org-register" element={<OrganizationRegistration />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
