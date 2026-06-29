export type UserRole = "admin";

export type MockUser = {
  email: string;
  initials: string;
  name: string;
  role: UserRole;
};

const STORAGE_KEY = "dprms.mock-user";

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "System Administrator",
};

export const ADMIN_USER: MockUser = {
  email: "admin@dost.gov.ph",
  initials: "AD",
  name: "DOST Admin",
  role: "admin",
};

export const ADMIN_CREDENTIALS = {
  email: "admin",
  password: "Admin@",
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

export function isValidAdminLogin(email: string, password: string) {
  return (
    email.trim().toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() &&
    password === ADMIN_CREDENTIALS.password
  );
}
