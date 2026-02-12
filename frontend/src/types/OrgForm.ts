// components/organization-registration/types.ts

export type OrgForm = {
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

export type FormErrors = Partial<Record<keyof OrgForm, string>>;
