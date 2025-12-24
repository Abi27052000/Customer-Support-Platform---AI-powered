import React, { useState } from "react";

// Use a safe empty props type to satisfy lint rules
type OrganizationRegistrationProps = Record<string, never>;

type OrgForm = {
  orgName: string;
  orgCode: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  adminName: string;
  adminEmail: string;
};

const initialForm: OrgForm = {
  orgName: "",
  orgCode: "",
  addressLine1: "",
  city: "",
  state: "",
  zip: "",
  adminName: "",
  adminEmail: "",
};

const steps = [
  "Organization Info",
  "Address",
  "Admin User",
  "Review & Submit",
];

export const OrganizationRegistration: React.FC<OrganizationRegistrationProps> = () => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [form, setForm] = useState<OrgForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof OrgForm, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (k: keyof OrgForm) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({ ...prev, [k]: e.target.value }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const validateStep = (stepIndex: number) => {
    const newErrors: Partial<Record<keyof OrgForm, string>> = {};

    if (stepIndex === 0) {
      if (!form.orgName.trim()) newErrors.orgName = "Organization name is required";
      if (!form.orgCode.trim()) newErrors.orgCode = "Organization code is required";
    }

    if (stepIndex === 1) {
      if (!form.addressLine1.trim()) newErrors.addressLine1 = "Address is required";
      if (!form.city.trim()) newErrors.city = "City is required";
    }

    if (stepIndex === 2) {
      if (!form.adminName.trim()) newErrors.adminName = "Admin name is required";
      if (!form.adminEmail.trim()) newErrors.adminEmail = "Admin email is required";
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.adminEmail))
        newErrors.adminEmail = "Enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(activeStep)) return;
    setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const goBack = () => {
    setActiveStep((s) => Math.max(s - 1, 0));
  };

  const goToStep = (index: number) => {
    // allow jumping back freely, forward only if previous steps are valid
    if (index <= activeStep) {
      setActiveStep(index);
      return;
    }

    // try to validate all intermediate steps
    for (let i = activeStep; i < index; i++) {
      if (!validateStep(i)) return;
    }

    setActiveStep(index);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    // validate last step as well
    if (!validateStep(activeStep)) return;
    // simple submit simulation
    setSubmitted(true);
  };

  const reset = () => {
    setForm(initialForm);
    setErrors({});
    setActiveStep(0);
    setSubmitted(false);
  };

 
  const stepBubbleClass = (active: boolean, done: boolean) =>
    `w-10 h-10 rounded-full flex items-center justify-center text-base font-semibold ${
      done ? "bg-emerald-500 text-white" : active ? "bg-blue-600 text-white" : "bg-indigo-50 text-indigo-800"
    }`;

  const stepItemClass = (active: boolean) =>
    `flex gap-4 items-start p-3 rounded-lg cursor-pointer ${active ? "bg-blue-50" : "hover:bg-gray-50"}`;

  const inputClass = (hasError?: boolean) =>
    `px-4 py-3 rounded-lg border text-base w-full focus:outline-none focus:ring-2 focus:ring-blue-300 ${
      hasError ? "border-red-500" : "border-gray-300"
    }`;

  const smallMuted = "text-base text-gray-500";
  const primaryBtn = "bg-blue-600 text-white px-4 py-3 rounded-lg text-base";
  const ghostBtn = "bg-white border border-gray-200 px-4 py-3 rounded-lg text-base";
  const successBox = "p-6 rounded-lg bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-100";

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto p-8 bg-gray-50 rounded-2xl shadow-sm flex gap-8">
        <aside className="min-w-[260px] bg-white rounded-lg p-4 shadow-inner">
          <h4 className="m-1 mb-3 text-base font-medium">Registration Steps</h4>

          <div>
            {steps.map((s, idx) => {
              const done = idx < activeStep || submitted;
              const active = idx === activeStep && !submitted;
              return (
                <div key={s} className={stepItemClass(active)} onClick={() => goToStep(idx)}>
                  <div className={stepBubbleClass(active, done)}>{done ? "✓" : idx + 1}</div>

                  <div className="flex-1">
                    <div className="font-semibold">{s}</div>
                    <div className={smallMuted}>
                      {idx === 0 && "Basic organization details"}
                      {idx === 1 && "Address where org operates"}
                      {idx === 2 && "Primary admin user"}
                      {idx === 3 && "Review everything and submit"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 bg-white rounded-lg p-8 shadow-inner">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="m-0 text-2xl font-semibold">{submitted ? "Registration Complete" : steps[activeStep]}</h3>
            <div className="ml-auto text-sm text-gray-400">{`${activeStep + 1} / ${steps.length}`}</div>
          </div>

          {submitted ? (
            <div className={successBox}>
              <h4 className="mt-0 mb-1">Organization registered</h4>
              <p className="m-0">The organization <strong>{form.orgName || "-"}</strong> has been registered successfully.</p>
              <div className="mt-3 flex gap-2">
                <button className={primaryBtn} onClick={reset}>
                  Register another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* Step panels */}
              {activeStep === 0 && (
                <section>
                  <div className="flex flex-col gap-2 mb-4">
                    <label className="text-base">Organization Name *</label>
                    <input
                      className={inputClass(!!errors.orgName)}
                      value={form.orgName}
                      onChange={handleChange("orgName")}
                      placeholder="Acme Corp"
                    />
                    {errors.orgName && <div className="text-red-500 text-sm">{errors.orgName}</div>}
                  </div>

                  <div className="flex flex-col gap-2 mb-4">
                    <label className="text-base">Organization Code *</label>
                    <input
                      className={inputClass(!!errors.orgCode)}
                      value={form.orgCode}
                      onChange={handleChange("orgCode")}
                      placeholder="acme-001"
                    />
                    {errors.orgCode && <div className="text-red-500 text-sm">{errors.orgCode}</div>}
                  </div>
                </section>
              )}

              {activeStep === 1 && (
                <section>
                  <div className="flex flex-col gap-2 mb-4">
                    <label className="text-base">Address line 1 *</label>
                    <input
                      className={inputClass(!!errors.addressLine1)}
                      value={form.addressLine1}
                      onChange={handleChange("addressLine1")}
                      placeholder="123 Main St"
                    />
                    {errors.addressLine1 && <div className="text-red-500 text-sm">{errors.addressLine1}</div>}
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col gap-2 mb-4">
                        <label className="text-base">City *</label>
                        <input className={inputClass(!!errors.city)} value={form.city} onChange={handleChange("city")} />
                        {errors.city && <div className="text-red-500 text-sm">{errors.city}</div>}
                      </div>
                    </div>

                    <div className="w-40">
                      <div className="flex flex-col gap-2 mb-4">
                        <label className="text-base">ZIP</label>
                        <input className={inputClass()} value={form.zip} onChange={handleChange("zip")} />
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {activeStep === 2 && (
                <section>
                  <div className="flex flex-col gap-2 mb-4">
                    <label className="text-base">Admin full name *</label>
                    <input className={inputClass(!!errors.adminName)} value={form.adminName} onChange={handleChange("adminName")} />
                    {errors.adminName && <div className="text-red-500 text-sm">{errors.adminName}</div>}
                  </div>

                  <div className="flex flex-col gap-2 mb-4">
                    <label className="text-base">Admin email *</label>
                    <input className={inputClass(!!errors.adminEmail)} value={form.adminEmail} onChange={handleChange("adminEmail")} />
                    {errors.adminEmail && <div className="text-red-500 text-sm">{errors.adminEmail}</div>}
                  </div>
                </section>
              )}

              {activeStep === 3 && (
                <section>
                  <h4 className="mt-0 mb-2 text-lg">Please review</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Organization</div>
                      <div className="font-semibold text-lg">{form.orgName || "-"}</div>
                      <div className="text-sm text-gray-500">{form.orgCode || "-"}</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-500">Admin</div>
                      <div className="font-semibold text-lg">{form.adminName || "-"}</div>
                      <div className="text-sm text-gray-500">{form.adminEmail || "-"}</div>
                    </div>

                    <div className="col-span-2">
                      <div className="text-sm text-gray-500">Address</div>
                      <div className="font-semibold text-lg">{form.addressLine1 || "-"}</div>
                      <div className="text-sm text-gray-500">{[form.city, form.state, form.zip].filter(Boolean).join(" • ") || "-"}</div>
                    </div>
                  </div>
                </section>
              )}

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={goBack} className={`${ghostBtn} ${activeStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={activeStep === 0}>
                  ← Back
                </button>

                {activeStep < steps.length - 1 && (
                  <button type="button" onClick={goNext} className={primaryBtn}>
                    Next →
                  </button>
                )}

                {activeStep === steps.length - 1 && (
                  <button type="submit" className={primaryBtn}>
                    Submit
                  </button>
                )}

                <button type="button" onClick={reset} className={ghostBtn}>
                  Reset
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
};
