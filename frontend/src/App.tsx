import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./Components/UserComponents/Layout/UserLayout";
import Dashboard from "../src/Pages/UserPages/Dashboard/Dashboard";
import Restaurant from "./Pages/UserPages/Restaurant/Restaurant";
import Orders from "./Pages/UserPages/Feedback/FeedbackPage";
import Settings from "./Pages/UserPages/Settings/Settings"
import AdminLayout from "./Components/AdminComponents/Layout/AdminLayout";
import Reports from "./Pages/UserPages/Reports/Reports";
import FeedbackPage from "./Pages/UserPages/Feedback/FeedbackPage";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        {/* USER ROUTES */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="restaurants" element={<Restaurant />} />
          <Route path="settings" element={<Settings />} />
          
          <Route path="reports" element={<Reports />} />
          <Route path="feedback" element={<FeedbackPage />} />
        </Route>

        {/* ADMIN ROUTES */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Restaurant />} />
          <Route path="orders" element={<Orders />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
