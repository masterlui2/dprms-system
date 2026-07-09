import type { ApplicationProgram, ApplicationRecord } from '../types/application'

export type UserRole = "admin" | "applicant" | "proponent";

export type MockUser = {
  applicationReference?: string;
  email: string;
  initials: string;
  name: string;
  program?: ApplicationProgram;
  role: UserRole;
};

const STORAGE_KEY = "dprms.mock-user";
const TOKEN_STORAGE_KEY = "dprms.auth-token";
const ACTIVATED_USERS_KEY = "dprms.mock-activated-users";

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "DOST Operations Administrator",
  applicant: "Beneficiary Portal User",
  proponent: "Project Proponent",
};

export const ADMIN_USER: MockUser = {
  email: "admin@dost.gov.ph",
  initials: "AD",
  name: "DOST Admin",
  role: "admin",
};

export const PROPONENT_USER: MockUser = {
  email: "proponent@dost.gov.ph",
  initials: "PR",
  name: "Maria Proponent",
  program: "SETUP",
  role: "proponent",
};

const MOCK_USERS = [
  {
    credentials: {
      email: "admin",
      password: "Admin@",
    },
    user: ADMIN_USER,
  },
  {
    credentials: {
      email: "proponent",
      password: "Proponent@",
    },
    user: PROPONENT_USER,
  },
];

export const MOCK_CREDENTIAL_HINTS = MOCK_USERS.map(({ credentials, user }) => {
  return {
    email: credentials.email,
    password: credentials.password,
    role: user.role,
  };
});

type ActivatedAccount = {
  credentials: {
    email: string;
    password: string;
  };
  user: MockUser;
};

function normalizeCredentialEmail(email: string) {
  return email.trim().toLowerCase();
}

function getActivatedAccounts(): ActivatedAccount[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawAccounts = window.localStorage.getItem(ACTIVATED_USERS_KEY);

  if (!rawAccounts) {
    return [];
  }

  try {
    return JSON.parse(rawAccounts) as ActivatedAccount[];
  } catch {
    window.localStorage.removeItem(ACTIVATED_USERS_KEY);
    return [];
  }
}

function saveActivatedAccounts(accounts: ActivatedAccount[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACTIVATED_USERS_KEY, JSON.stringify(accounts));
}

export function authenticateMockUser(email: string, password: string) {
  const account = MOCK_USERS.find(({ credentials }) => {
    return (
      normalizeCredentialEmail(credentials.email) ===
        normalizeCredentialEmail(email) && credentials.password === password
    );
  });

  if (account) {
    return account.user;
  }

  const activatedAccount = getActivatedAccounts().find(({ credentials }) => {
    return (
      normalizeCredentialEmail(credentials.email) ===
        normalizeCredentialEmail(email) && credentials.password === password
    );
  });

  return activatedAccount?.user ?? null;
}

export function isValidLogin(email: string, password: string) {
  return Boolean(authenticateMockUser(email, password));
}

export const DEFAULT_REDIRECT_BY_ROLE: Record<UserRole, string> = {
  admin: "/dashboard",
  applicant: "/",
  proponent: "/",
};

function getInitials(name: string) {
  const [first = "B", second = "P"] = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return `${first[0] ?? "B"}${second[0] ?? first[1] ?? "P"}`.toUpperCase();
}

export function activateApplicantAccount({
  application,
  email,
  password,
}: {
  application: ApplicationRecord;
  email: string;
  password: string;
}): MockUser {
  const user: MockUser = {
    applicationReference: application.referenceNo,
    email: email.trim().toLowerCase(),
    initials: getInitials(application.applicantName || application.organizationName),
    name: application.applicantName || application.organizationName,
    program: application.program,
    role: "applicant",
  };
  const accounts = getActivatedAccounts().filter(
    (account) =>
      normalizeCredentialEmail(account.credentials.email) !==
        normalizeCredentialEmail(email) &&
      account.user.applicationReference !== application.referenceNo,
  );

  saveActivatedAccounts([
    {
      credentials: {
        email: email.trim().toLowerCase(),
        password,
      },
      user,
    },
    ...accounts,
  ]);

  return user;
}

export function isApplicationActivated(referenceNo: string) {
  return getActivatedAccounts().some(
    (account) => account.user.applicationReference === referenceNo,
  );
}

export function getMockUser(): MockUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = window.localStorage.getItem(STORAGE_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as MockUser;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function setMockUser(user: MockUser) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearMockUser() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}
