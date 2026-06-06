import React, { useEffect, useMemo, useState } from "react";
import { Bell, BriefcaseBusiness, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";
import { accountSettingsApi } from "../../../services/accountSettingsApi";

type SettingsTab = "profile" | "organization" | "security" | "notifications";

type NotificationPrefs = {
  ticketUpdates: boolean;
  aiSummaries: boolean;
  staffReplies: boolean;
};

const NOTIFICATION_KEY = "support-iq-user-notification-preferences";

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "organization", label: "Organizations", icon: BriefcaseBusiness },
  { id: "security", label: "Security", icon: LockKeyhole },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const defaultPrefs: NotificationPrefs = {
  ticketUpdates: true,
  aiSummaries: true,
  staffReplies: true,
};

const roleLabel = (role?: string) =>
  ({
    user: "Customer",
    organization_staff: "Organization Staff",
    organization_admin: "Organization Admin",
    admin: "Platform Admin",
  })[role || ""] || "Account";

const readNotificationPrefs = (): NotificationPrefs => {
  try {
    const saved = localStorage.getItem(NOTIFICATION_KEY);
    return saved ? { ...defaultPrefs, ...JSON.parse(saved) } : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
};

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, orgs, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(readNotificationPrefs);

  useEffect(() => {
    setProfileName(user?.name || "");
  }, [user?.name]);

  const initials = useMemo(() => {
    const source = profileName || user?.email || "U";
    return source
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [profileName, user?.email]);

  const activeOrg = useMemo(
    () => orgs.find((org) => String(org.id) === String(user?.orgId)),
    [orgs, user?.orgId]
  );

  const saveProfile = async () => {
    setNotice(null);
    const name = profileName.trim();

    if (name.length < 2) {
      setNotice({ type: "error", text: "Name must be at least 2 characters." });
      return;
    }

    try {
      setProfileSaving(true);
      const response = await accountSettingsApi.updateProfile({ name });
      updateUser(response.user);
      setNotice({ type: "success", text: "Profile updated successfully." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Failed to update profile." });
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);

    if (passwordData.newPassword.length < 8) {
      setNotice({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setNotice({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    try {
      setPasswordSaving(true);
      await accountSettingsApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setNotice({ type: "success", text: "Password updated successfully." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Failed to update password." });
    } finally {
      setPasswordSaving(false);
    }
  };

  const updateNotificationPref = (key: keyof NotificationPrefs) => {
    setNotificationPrefs((current) => {
      const next = { ...current, [key]: !current[key] };
      localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(next));
      setNotice({ type: "success", text: "Notification preferences saved." });
      return next;
    });
  };

  return (
    <div className="w-full space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-[#2D2A8C]">
              <ShieldCheck size={14} />
              Account control center
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-950">Settings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage your profile, selected organization, password, and support notifications.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#2D2A8C] text-sm font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{user?.name || "User"}</p>
              <p className="truncate text-xs text-slate-500">{roleLabel(user?.role)}</p>
            </div>
          </div>
        </div>
      </div>

      {notice && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setNotice(null);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#2D2A8C] text-white"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          {activeTab === "profile" && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-950">Profile Details</h2>
              <p className="mt-1 text-sm text-slate-500">Your name is shown on tickets, ratings, and account activity.</p>

              <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[160px_1fr]">
                <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-indigo-50 text-3xl font-bold text-[#2D2A8C]">
                  {initials}
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                    <input
                      value={profileName}
                      onChange={(event) => setProfileName(event.target.value)}
                      className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[#2D2A8C] focus:bg-white"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
                    <div className="flex h-12 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">
                      <Mail size={17} />
                      {user?.email}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Email changes are restricted to prevent account ownership mistakes.</p>
                  </div>

                  <button
                    onClick={saveProfile}
                    disabled={profileSaving || profileName.trim() === user?.name}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#2D2A8C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#242170] disabled:bg-slate-300"
                  >
                    <Save size={17} />
                    {profileSaving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "organization" && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-950">Organizations</h2>
              <p className="mt-1 text-sm text-slate-500">These are the workspaces connected to your account.</p>

              <div className="mt-6 space-y-3">
                {orgs.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <p className="font-semibold text-slate-700">No organizations selected yet</p>
                    <p className="mt-1 text-sm text-slate-500">Choose an organization before using AI support features.</p>
                    <button
                      onClick={() => navigate("/org-picker")}
                      className="mt-4 rounded-lg bg-[#2D2A8C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#242170]"
                    >
                      Choose Organization
                    </button>
                  </div>
                ) : (
                  orgs.map((org) => {
                    const selected = String(org.id) === String(user?.orgId);
                    return (
                      <div key={org.id} className="rounded-lg border border-slate-200 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 font-bold text-[#2D2A8C]">
                              {org.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-950">{org.name}</p>
                              <p className="text-xs text-slate-500">{selected ? "Current workspace" : "Available workspace"}</p>
                            </div>
                          </div>
                          {selected && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 size={14} />
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {orgs.length > 0 && (
                <button
                  onClick={() => navigate("/org-picker")}
                  className="mt-5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Switch organization
                </button>
              )}
              {activeOrg && <p className="mt-3 text-xs text-slate-400">Currently using {activeOrg.name}.</p>}
            </div>
          )}

          {activeTab === "security" && (
            <form onSubmit={changePassword} className="p-6">
              <h2 className="text-lg font-semibold text-slate-950">Security</h2>
              <p className="mt-1 text-sm text-slate-500">Change your password using your current login credentials.</p>

              <div className="mt-6 max-w-xl space-y-5">
                {[
                  ["currentPassword", "Current password"],
                  ["newPassword", "New password"],
                  ["confirmPassword", "Confirm new password"],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwordData[key as keyof typeof passwordData]}
                        onChange={(event) => setPasswordData((current) => ({ ...current, [key]: event.target.value }))}
                        className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 pr-12 text-sm outline-none transition focus:border-[#2D2A8C] focus:bg-white"
                      />
                      {key === "currentPassword" && (
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2D2A8C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#242170] disabled:bg-slate-300"
                >
                  <LockKeyhole size={17} />
                  {passwordSaving ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "notifications" && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-950">Notifications</h2>
              <p className="mt-1 text-sm text-slate-500">Choose which browser-side support reminders should stay enabled.</p>

              <div className="mt-6 max-w-2xl divide-y divide-slate-100 rounded-lg border border-slate-200">
                {[
                  ["ticketUpdates", "Ticket status updates", "Remind me when my support tickets need attention."],
                  ["aiSummaries", "AI summary reminders", "Show reminders to review saved AI chat and voice summaries."],
                  ["staffReplies", "Staff reply reminders", "Keep staff response reminders visible in support areas."],
                ].map(([key, title, description]) => (
                  <div key={key} className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-semibold text-slate-950">{title}</p>
                      <p className="mt-1 text-sm text-slate-500">{description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateNotificationPref(key as keyof NotificationPrefs)}
                      className={`relative h-7 w-12 rounded-full transition ${
                        notificationPrefs[key as keyof NotificationPrefs] ? "bg-[#2D2A8C]" : "bg-slate-300"
                      }`}
                      aria-pressed={notificationPrefs[key as keyof NotificationPrefs]}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                          notificationPrefs[key as keyof NotificationPrefs] ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Settings;
