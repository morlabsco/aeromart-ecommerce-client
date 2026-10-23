/* eslint-disable @typescript-eslint/no-explicit-any */
// Server-side session helper for the Demo eCommerce backend.
//
// The access token is stored in an httpOnly `accessToken` cookie (set by the
// login Server Action). This module decodes it for SSR/Route Handlers and
// exposes a getSession() used by proxy.ts and layouts.

import "server-only";
import { cookies } from "next/headers";
import { getTokenPayload } from "@/lib/services/verify-token";
import type { JwtPayload } from "@/lib/types/backend";

const ACCESS_TOKEN_COOKIE = "accessToken";

export interface Session {
  user: JwtPayload | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export async function getSession(): Promise<Session> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const user = getTokenPayload(token);

  return {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };
}
