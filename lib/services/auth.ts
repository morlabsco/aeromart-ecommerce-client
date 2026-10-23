/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { cookies } from "next/headers";
import { apiRequest, toServiceResult } from "./api-client";
import type {
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginResponse,
  ResetPasswordPayload,
  ServiceResult,
  VerifyOtpPayload,
  VerifyOtpResponse,
} from "@/lib/types/backend";

const ACCESS_TOKEN_COOKIE = "accessToken";

const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

function setAccessToken(token: string) {
  return cookies().then((store) => {
    console.log(
      `[auth.setAccessToken] setting cookie "${ACCESS_TOKEN_COOKIE}"`,
      { maxAge: ACCESS_TOKEN_COOKIE_OPTIONS.maxAge, sameSite: ACCESS_TOKEN_COOKIE_OPTIONS.sameSite, secure: ACCESS_TOKEN_COOKIE_OPTIONS.secure }
    );
    return store.set(ACCESS_TOKEN_COOKIE, token, ACCESS_TOKEN_COOKIE_OPTIONS);
  });
}

export const login = async (payload: {
  email: string;
  password: string;
}): Promise<ServiceResult<LoginResponse>> => {
  try {
    const result = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: payload,
      skipAuth: true,
    });
    console.log("[auth.login] apiRequest resolved", {
      success: result.success,
      message: result.message,
      hasAccessToken: !!result.data?.accessToken,
    });
    if (result.data?.accessToken) {
      await setAccessToken(result.data.accessToken);
      console.log("[auth.login] accessToken cookie set");
    } else {
      console.warn("[auth.login] no accessToken in response", result);
    }
    return result;
  } catch (error: any) {
    console.error("[auth.login] apiRequest threw", error);
    return toServiceResult(error);
  }
};

export const registerAction = async (payload: {
  name: string;
  email: string;
  password: string;
}): Promise<ServiceResult<LoginResponse>> => {
  try {
    const result = await apiRequest<LoginResponse>("/user/register", {
      method: "POST",
      body: { ...payload, role: "customer" },
      skipAuth: true,
    });
    if (result.data?.accessToken) {
      await setAccessToken(result.data.accessToken);
    }
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const logoutAction = async () => {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(ACCESS_TOKEN_COOKIE);
    return { success: true };
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const refreshToken = async (): Promise<ServiceResult<LoginResponse>> => {
  try {
    const result = await apiRequest<LoginResponse>("/auth/refresh-token", {
      method: "POST",
      skipAuth: true,
    });
    if (result.data?.accessToken) {
      await setAccessToken(result.data.accessToken);
    }
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const changePassword = async (
  payload: ChangePasswordPayload
): Promise<ServiceResult<null>> => {
  try {
    const result = await apiRequest<null>("/auth/change-password", {
      method: "POST",
      body: payload,
    });
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const forgotPassword = async (
  payload: ForgotPasswordPayload
): Promise<ServiceResult<null>> => {
  try {
    const result = await apiRequest<null>("/auth/forgot-password", {
      method: "POST",
      body: payload,
      skipAuth: true,
    });
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const verifyOtp = async (
  payload: VerifyOtpPayload
): Promise<ServiceResult<VerifyOtpResponse>> => {
  try {
    const result = await apiRequest<VerifyOtpResponse>("/auth/verify-otp", {
      method: "POST",
      body: payload,
      skipAuth: true,
    });
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};

export const resetPassword = async (
  payload: ResetPasswordPayload
): Promise<ServiceResult<{ message: string }>> => {
  try {
    const result = await apiRequest<{ message: string }>(
      "/auth/reset-password",
      {
        method: "POST",
        body: payload,
        skipAuth: true,
      }
    );
    return result;
  } catch (error: any) {
    return toServiceResult(error);
  }
};
