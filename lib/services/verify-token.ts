/* eslint-disable @typescript-eslint/no-explicit-any */
// Access token helpers for the Demo eCommerce backend.
//
// The access token is a JWT (see docs/v7-backend-usage-guide.md §3 and §16.5).
// The client cannot verify the signature (secret lives server-side), so it:
//   1. decodes the payload to read { userId, name, email, role, isActive }
//   2. checks expiry client-side
//   3. on expiry, calls POST /auth/refresh-token, the httpOnly refreshToken
//      cookie is sent automatically and a new accessToken comes back in the body.
//
// getValidToken() returns the RAW JWT string. The backend auth middleware does
// `jwt.verify(req.headers.authorization, secret)`, it does not strip any
// "Bearer " scheme, so the Authorization header must be the raw token.

import { cookies } from "next/headers";
import { BASE_API } from "./api-client";
import type { JwtPayload, RefreshTokenResponse } from "@/lib/types/backend";

const ACCESS_TOKEN_COOKIE = "accessToken";

interface DecodedToken extends JwtPayload {
  exp?: number;
}

function decodePayload(token: string): DecodedToken | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    // Edge-safe base64url decode (works in both Node and edge runtimes).
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const decoded = JSON.parse(
      decodeURIComponent(
        atob(padded)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )
    );
    return decoded as DecodedToken;
  } catch {
    return null;
  }
}

function isExpired(payload: DecodedToken): boolean {
  if (typeof payload.exp !== "number") return false;
  return Date.now() >= payload.exp * 1000;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_API}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      success?: boolean;
      data?: RefreshTokenResponse;
    };
    if (!json.success || !json.data?.accessToken) return null;
    return json.data.accessToken;
  } catch {
    return null;
  }
}

/**
 * Returns a valid access token (refreshing if the stored access token is
 * expired) or null when the user is not authenticated.
 *
 * NOTE: The backend auth middleware reads `req.headers.authorization` and
 * passes it straight to `jwt.verify()`, it expects the RAW JWT string,
 * not a `Bearer <token>` scheme. The api-client sends this value directly
 * as the Authorization header.
 */
export async function getValidToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) return null;

  const payload = decodePayload(token);
  if (!payload) return null;

  if (!isExpired(payload)) return token;

  // Expired, try to refresh using the httpOnly refreshToken cookie.
  const newToken = await refreshAccessToken();
  if (newToken) {
    return newToken;
  }

  return null;
}

/**
 * Decodes the JWT payload without validating expiry. Returns null if the token
 * is missing or malformed.
 */
export function getTokenPayload(
  token: string | null | undefined
): JwtPayload | null {
  if (!token) return null;
  return decodePayload(token);
}
