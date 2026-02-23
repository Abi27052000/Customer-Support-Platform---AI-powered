import React, { useState } from "react";
import {Stepper} from "../../../Components/AdminComponents/OrganizationRegistration/Stepper/Stepper.tsx";
import {SuccessMessage} from "../../../Components/AdminComponents/OrganizationRegistration/ui/SuccessMessage.tsx";
import {OrgDetailsStep} from "../../../Components/AdminComponents/OrganizationRegistration/steps-ui/OrgDetailsStep.tsx";
import {
  AdminAccountStep
} from "../../../Components/AdminComponents/OrganizationRegistration/steps-ui/AdminAccountStep.tsx";
import {ServicesStep} from "../../../Components/AdminComponents/OrganizationRegistration/steps-ui/ServicesStep.tsx";
import {ReviewStep} from "../../../Components/AdminComponents/OrganizationRegistration/steps-ui/ReviewStep.tsx";
import {Button} from "../../../Components/AdminComponents/OrganizationRegistration/ui/Button.tsx";

/* ---------- Local types ---------- */
type OrgForm = {
  orgName: string;
  addressLine1: string;
  adminUsername: string;
  adminPassword: string;
  services: {
    aiChat: boolean;
    aiVoice: boolean;
    aiInsights: boolean;
  };
};

type Errors = Partial<Record<keyof OrgForm, string>>;

/* ---------- Steps ---------- */
const STEPS = [
  { label: "Organization Details", description: "Name & address" },
  { label: "Admin Account", description: "Login credentials" },
  { label: "Services", description: "AI features" },
  { label: "Review & Submit", description: "Confirm details" },
];

const initialForm: OrgForm = {
  orgName: "",
  addressLine1: "",
  adminUsername: "",
  adminPassword: "",
  services: {
    aiChat: false,
    aiVoice: false,
    aiInsights: false,
  },
};

export const OrganizationRegistration: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState<OrgForm>(initialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  /* ---------- Helpers ---------- */
  const updateField = <K extends keyof OrgForm>(key: K, value: OrgForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };


  const validateStep = () => {
    const e: Errors = {};

    if (activeStep === 0) {
      if (!form.orgName.trim()) e.orgName = "Organization name required";
      if (!form.addressLine1.trim())
        e.addressLine1 = "Address required";
    }

    if (activeStep === 1) {
      if (!form.adminUsername.trim())
        e.adminUsername = "Username required";
      if (!form.adminPassword.trim())
        e.adminPassword = "Password required";
      else if (form.adminPassword.length < 6)
        e.adminPassword = "Minimum 6 characters";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setActiveStep((s) => Math.max(s - 1, 0));

  const submit = () => {
    if (!validateStep()) return;
    setSubmitted(true);
  };

  const reset = () => {
    setForm(initialForm);
    setErrors({});
    setActiveStep(0);
    setSubmitted(false);
  };

  const progressPercent = Math.round((activeStep / (STEPS.length - 1)) * 100);

  /* ---------- UI ---------- */
  return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-50 p-8">
        <div className="max-w-5xl mx-auto grid md:grid-cols-[280px_1fr] gap-6 items-start">

          {/* Left: Stepper column */}
          <aside className="hidden md:block">
            <div className="bg-white rounded-2xl shadow p-4 sticky top-8">
              <h4 className="text-sm font-semibold text-indigo-700 mb-3">Registration</h4>
              <Stepper
                  steps={STEPS}
                  activeStep={activeStep}
                  submitted={submitted}
                  onStepClick={(i) => i <= activeStep && setActiveStep(i)}
              />
            </div>
          </aside>

          {/* Right: Main content */}
          <main className="">
            {submitted ? (
                <div className="bg-white rounded-2xl shadow p-8">
                  <SuccessMessage orgName={form.orgName} onReset={reset} />
                </div>
            ) : (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl shadow">🏢</div>
                      <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Organization Registration</h1>
                        <p className="mt-1 text-sm text-slate-500">Create an organization and enable AI services for your users.</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-slate-500">Progress</div>
                      <div className="mt-1 text-sm font-semibold text-indigo-700">{progressPercent}%</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-3 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all" style={{ width: `${progressPercent}%` }} />
                  </div>

                  {/* Form card */}
                  <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-slate-800">{STEPS[activeStep].label}</h2>
                      <p className="text-sm text-slate-500">{STEPS[activeStep].description}</p>
                    </div>

                    <div className="space-y-6">
                      {activeStep === 0 && (
                          <OrgDetailsStep form={form} errors={errors} onChange={updateField} />
                      )}

                      {activeStep === 1 && (
                          <AdminAccountStep form={form} errors={errors} onChange={updateField} />
                      )}

                      {activeStep === 2 && (
                          <ServicesStep services={form.services} onChange={(k, v) => setForm((p) => ({ ...p, services: { ...p.services, [k]: v } }))} />
                      )}

                      {activeStep === 3 && <ReviewStep form={form} />}

                      {/* Actions */}
                      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="flex-1 sm:flex-auto">
                          <Button variant="ghost" onClick={back} disabled={activeStep === 0}>← Back</Button>
                        </div>

                        <div className="flex-1 sm:flex-none">
                          {activeStep < STEPS.length - 1 ? (
                              <Button onClick={next}>Next →</Button>
                          ) : (
                              <Button onClick={submit}>Submit</Button>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Footer hint */}
                  <div className="text-sm text-slate-500">Need help? Contact support or check documentation for onboarding tips.</div>
                </div>
            )}
          </main>

        </div>
      </div>
  );
};
