// Auth module types, docs/v7-backend-usage-guide.md §5.

export type UserRole = "admin" | "manager" | "customer";

export interface JwtPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  /** Present when merged from the user profile (not part of the JWT itself). */
  photoUrl?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  resetToken: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}
