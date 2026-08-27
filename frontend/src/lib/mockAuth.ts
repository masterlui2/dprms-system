import type { ApplicationProgram, ApplicationRecord } from '../types/application'
import { normalizeUserRole, ROLES, type UserRole } from '../config/permissions'

export type { UserRole } from '../config/permissions'
export { ROLE_LABEL } from '../config/permissions'

export type MockUser = {
  id?: number;
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

export const ADMIN_USER: MockUser = {
  email: "admin@dost.gov.ph",
  initials: "AD",
  name: "DOST Admin",
  role: ROLES.SYSTEM_ADMIN,
};

export const SETUP_PROPONENT_USER: MockUser = {
  email: "setup.proponent@dost.gov.ph",
  initials: "MS",
  name: "Maria SETUP Proponent",
  program: "SETUP",
  role: ROLES.PROPONENT,
};

export const PROPONENT_USER: MockUser = SETUP_PROPONENT_USER;

export const GIA_PROPONENT_USER: MockUser = {
  email: "gia.proponent@dost.gov.ph",
  initials: "GP",
  name: "Gina GIA Project Leader",
  program: "GIA",
  role: ROLES.PROPONENT,
};

const SETUP_STAFF_USER: MockUser = {
  email: 'setup.staff@dost.gov.ph',
  initials: 'SS',
  name: 'Paolo SETUP Staff (SSCP)',
  program: 'SETUP',
  role: ROLES.PROJECT_STAFF,
};

const GIA_STAFF_USER: MockUser = {
  email: 'gia.staff@dost.gov.ph',
  initials: 'GS',
  name: 'Carla GIA Staff (CEST)',
  program: 'GIA',
  role: ROLES.PROJECT_STAFF,
};

const SETUP_FOCAL_USER: MockUser = {
  email: 'setup.focal@dost.gov.ph',
  initials: 'SF',
  name: 'Faith SETUP Focal (SSCP)',
  program: 'SETUP',
  role: ROLES.FOCAL,
};

const GIA_FOCAL_USER: MockUser = {
  email: 'gia.focal@dost.gov.ph',
  initials: 'GF',
  name: 'Felix GIA Focal (CEST)',
  program: 'GIA',
  role: ROLES.FOCAL,
};

const DIRECTOR_USER: MockUser = {
  email: 'director@dost.gov.ph', initials: 'PD', name: 'Pat Director Approver', role: ROLES.PROVINCIAL_DIRECTOR,
};
const RPMO_USER: MockUser = {
  email: 'rpmo@dost.gov.ph', initials: 'RV', name: 'Rico Regional', role: ROLES.RPMO,
};

const MOCK_USERS = [
  { credentials: { email: "admin@dost.gov.ph", password: "Dprms@123" }, user: ADMIN_USER },
  { credentials: { email: "setup.proponent@dost.gov.ph", password: "Dprms@123" }, user: SETUP_PROPONENT_USER },
  { credentials: { email: "gia.proponent@dost.gov.ph", password: "Dprms@123" }, user: GIA_PROPONENT_USER },
  { credentials: { email: "setup.staff@dost.gov.ph", password: "Dprms@123" }, user: SETUP_STAFF_USER },
  { credentials: { email: "gia.staff@dost.gov.ph", password: "Dprms@123" }, user: GIA_STAFF_USER },
  { credentials: { email: "setup.focal@dost.gov.ph", password: "Dprms@123" }, user: SETUP_FOCAL_USER },
  { credentials: { email: "gia.focal@dost.gov.ph", password: "Dprms@123" }, user: GIA_FOCAL_USER },
  { credentials: { email: 'director@dost.gov.ph', password: 'Dprms@123' }, user: DIRECTOR_USER },
  { credentials: { email: 'rpmo@dost.gov.ph', password: 'Dprms@123' }, user: RPMO_USER },
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

function normalizeStoredUser(user: MockUser): MockUser {
  return { ...user, role: normalizeUserRole(user.role) };
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

  return activatedAccount ? normalizeStoredUser(activatedAccount.user) : null;
}

export function isValidLogin(email: string, password: string) {
  return Boolean(authenticateMockUser(email, password));
}

export const DEFAULT_REDIRECT_BY_ROLE: Record<UserRole, string> = {
  [ROLES.SYSTEM_ADMIN]: "/dashboard",
  [ROLES.PROJECT_STAFF]: "/dashboard",
  [ROLES.FOCAL]: "/dashboard",
  [ROLES.PROVINCIAL_DIRECTOR]: "/dashboard",
  [ROLES.RPMO]: "/dashboard",
  [ROLES.PROPONENT]: "/dashboard",
};

export function getDefaultRedirect(user: MockUser) {
  if (user.role === ROLES.PROPONENT) {
    return user.program ? `/programs/${user.program.toLowerCase()}` : "/";
  }

  return DEFAULT_REDIRECT_BY_ROLE[user.role];
}

function getInitials(name: string) {
  const [first = "B", second = "P"] = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return `${first[0] ?? "B"}${second[0] ?? first[1] ?? "P"}`.toUpperCase();
}

export function registerUserAccount({
  email,
  name,
  password,
  program,
}: {
  email: string;
  name: string;
  password: string;
  program: ApplicationProgram;
}): MockUser {
  const user: MockUser = {
    email: email.trim().toLowerCase(),
    initials: getInitials(name),
    name: name.trim(),
    program,
    role: ROLES.PROPONENT,
  };

  const accounts = getActivatedAccounts().filter(
    (account) =>
      normalizeCredentialEmail(account.credentials.email) !==
      normalizeCredentialEmail(email),
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
    role: ROLES.PROPONENT,
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
    return normalizeStoredUser(JSON.parse(rawUser) as MockUser);
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
