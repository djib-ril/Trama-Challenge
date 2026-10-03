import crypto from "crypto";
import { db, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";

export const SESSION_COOKIE = "sid";
export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
export interface AuthUser { id: string; email: string | null; firstName: string | null; lastName: string | null; profileImageUrl: string | null; displayName?: string | null; preferences?: unknown; }
export interface SessionData { user: AuthUser; access_token: string; refresh_token?: string; expires_at?: number; sessionExpiresAt?: number; role?: "admin"; adminSlot?: 1 | 2; }

export async function createSession(data: SessionData, ttl = SESSION_TTL) {
  const sid = crypto.randomBytes(32).toString("hex");
  await db.insert(sessionsTable).values({ sid, sess: data as unknown as Record<string, unknown>, expire: new Date(Date.now() + ttl) });
  return sid;
}
export async function getSession(sid: string) {
  const [row] = await db.select().from(sessionsTable).where(eq(sessionsTable.sid, sid));
  if (!row || row.expire < new Date()) { if (row) await db.delete(sessionsTable).where(eq(sessionsTable.sid, sid)); return null; }
  return row.sess as unknown as SessionData;
}
export async function deleteSession(sid: string) { await db.delete(sessionsTable).where(eq(sessionsTable.sid, sid)); }
export function getSessionId(req: Request) { const h = req.headers.authorization; return h?.startsWith("Bearer ") ? h.slice(7) : req.cookies?.[SESSION_COOKIE]; }
export async function clearSession(res: Response, sid?: string) { if (sid) await deleteSession(sid); res.clearCookie(SESSION_COOKIE, { path: "/" }); }