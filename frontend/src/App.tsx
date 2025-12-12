import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./Components/UserComponents/Layout/UserLayout";
import Dashboard from "../src/Pages/UserPages/Dashboard/Dashboard";
import Settings from "./Pages/UserPages/Settings/Settings"
import AdminLayout from "./Components/AdminComponents/Layout/AdminLayout";
import Reports from "./Pages/UserPages/Reports/Reports";
import FeedbackPage from "./Pages/UserPages/Feedback/FeedbackPage";
import { ReferenceData } from "./Pages/Adminpages/RefDataPage/RefDataPage";
import { OrganizationRegistration } from "./Pages/Adminpages/OrganizationRegistration/OrganizationRegistration";
import { AITextPage } from "./Pages/UserPages/AITextChat/AITextChat";
import { AIVoiceChat } from "./Pages/UserPages/AIVoiceChat/AIVoiceChat";
import { AISummary } from "./Pages/UserPages/AISummary/AISummary";

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
          <Route path="reports" element={<Reports />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* ADMIN ROUTES */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="ref-data" element={<ReferenceData />} />
          <Route path="org-register" element={<OrganizationRegistration />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
