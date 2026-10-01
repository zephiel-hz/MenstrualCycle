import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "ricils_session";
const AUTH_SECRET = process.env.AUTH_SECRET || "ricils_default_super_secret_session_key_32_chars_min";
const key = new TextEncoder().encode(AUTH_SECRET);

export interface SessionPayload {
  userId: string;
  email: string;
  displayName?: string | null;
  expiresAt?: number;
}

export async function createSessionToken(payload: Omit<SessionPayload, "expiresAt">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) {
    return null;
  }
  return verifySessionToken(sessionCookie.value);
}

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export function setSessionCookie(response: NextResponse, token: string) {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export function clearSessionCookie(response: NextResponse) {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
