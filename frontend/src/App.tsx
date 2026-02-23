import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./Components/UserComponents/Layout/UserLayout";
import Dashboard from "../src/Pages/UserPages/Dashboard/Dashboard";
import Settings from "./Pages/UserPages/Settings/Settings"
import AdminLayout from "./Components/AdminComponents/Layout/AdminLayout";
import Reports from "./Pages/UserPages/Reports/Reports";
import FeedbackPage from "./Pages/UserPages/Feedback/FeedbackPage";
import { ReferenceDataPage } from "./Pages/Adminpages/RefDataPage/RefDataPage";
import { OrganizationRegistration } from "./Pages/Adminpages/OrganizationRegistration/OrganizationRegistration";
import { AITextPage } from "./Pages/UserPages/AITextChat/AITextChat";
import { AIVoiceChat } from "./Pages/UserPages/AIVoiceChat/AIVoiceChat";
import { AISummary } from "./Pages/UserPages/AISummary/AISummary";
import Register from "./Pages/Register.tsx";
import Login from "./Pages/Login.tsx";

// Org Staff pages
import OrgStaffDashboard from "./Pages/OrgStaffPages/Dashboard";
import OrgStaffProfile from "./Pages/OrgStaffPages/Profile";
import OrgStaffReports from "./Pages/OrgStaffPages/Reports";
import OrgStaffSettings from "./Pages/OrgStaffPages/Settings";
import OrgStaffConversations from "./Pages/OrgStaffPages/Conversations";
import { TextEmotionPage } from "./Pages/UserPages/TextEmotion/TextEmotionPage";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        {/* USER ROUTES */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="AI-chat" element={<AITextPage />} />
          <Route path="AI-voice" element={<AIVoiceChat />} />
          <Route path="AI-summary" element={<AISummary />} />
          <Route path="text-emotion" element={<TextEmotionPage />} />
          <Route path="reports" element={<Reports />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* ORG STAFF ROUTES (reuse user layout) */}
        <Route path="/staff" element={<MainLayout />}>
          <Route index element={<OrgStaffDashboard/>} />
          <Route path="dashboard" element={<OrgStaffDashboard/>} />
          <Route path="conversations" element={<OrgStaffConversations/>} />
          <Route path="profile" element={<OrgStaffProfile/>} />
          <Route path="reports" element={<OrgStaffReports/>} />
          <Route path="settings" element={<OrgStaffSettings/>} />
        </Route>

        {/* ADMIN ROUTES */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="ref-data" element={<ReferenceDataPage />} />
          <Route path="org-register" element={<OrganizationRegistration />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="register" element={<Register/>} />
        <Route path="login" element={<Login/>} />
      </Routes>

    </BrowserRouter>
  );
}

export default App
