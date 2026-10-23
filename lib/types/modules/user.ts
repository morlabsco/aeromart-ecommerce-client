// User module types, docs/v7-backend-usage-guide.md §6.

import type { UserRole } from "./auth";

export interface UserClientInfo {
  device?: string;
  browser?: string;
  ipAddress?: string;
  os?: string;
  userAgent?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  photoUrl: string | null;
  phoneNo?: string;
  gender?: "Male" | "Female" | "Other";
  dateOfBirth?: string;
  address?: string;
  clientInfo?: UserClientInfo;
  lastLogin?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}
