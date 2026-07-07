export type UserRole = "admin" | "proponent";

export type MockUser = {
  email: string;
  initials: string;
  name: string;
  role: UserRole;
};

const STORAGE_KEY = "dprms.mock-user";

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "System Administrator",
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

function normalizeCredentialEmail(email: string) {
  return email.trim().toLowerCase();
}

export function authenticateMockUser(email: string, password: string) {
  const account = MOCK_USERS.find(({ credentials }) => {
    return (
      normalizeCredentialEmail(credentials.email) ===
        normalizeCredentialEmail(email) && credentials.password === password
    );
  });

  return account?.user ?? null;
}

export function isValidLogin(email: string, password: string) {
  return Boolean(authenticateMockUser(email, password));
}

export const DEFAULT_REDIRECT_BY_ROLE: Record<UserRole, string> = {
  admin: "/dashboard",
  proponent: "/",
};

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

export function clearMockUser() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
