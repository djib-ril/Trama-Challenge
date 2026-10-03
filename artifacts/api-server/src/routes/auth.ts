import { Router, type Request, type Response } from "express";
import * as oidc from "openid-client";
import { db, usersTable } from "@workspace/db";
import { createSession, clearSession, getSessionId, SESSION_COOKIE, SESSION_TTL, type AuthUser } from "../lib/auth";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();
const ADMIN_USERNAME = "admins";
const ADMIN_PASSWORD_SHA256 = "4675f59c50cb6a721b7e8cdb7015eed7352e9b6f6564eea8e3ab47cbe91614ba";
const ADMIN_SESSION_TTL = 24 * 60 * 60 * 1000;
const issuer = new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc");
let config: oidc.Configuration | null = null;
async function oidcConfig() { return config ??= await oidc.discovery(issuer, process.env.REPL_ID!); }
function origin(req: Request) { return `${req.headers["x-forwarded-proto"] ?? "https"}://${req.headers["x-forwarded-host"] ?? req.headers.host}`; }
function returnTo(value: unknown) { return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/"; }
function cookie(res: Response, name: string, value: string, maxAge = 600000) { res.cookie(name, value, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge }); }

router.get("/auth/user", (req, res) => res.json({ user: req.isAuthenticated() ? req.user : null }));
router.get("/admin/user", (req, res) => res.json({ user: req.isAdmin() ? req.user : null }));
router.post("/admin/login", async (req, res) => {
  const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
  const validPassword = crypto.timingSafeEqual(
    Buffer.from(passwordHash, "utf8"),
    Buffer.from(ADMIN_PASSWORD_SHA256, "utf8"),
  );
  if (username !== ADMIN_USERNAME || !validPassword) {
    res.status(401).json({ message: "Invalid admin username or password." });
    return;
  }

  const adminUser: AuthUser = {
    id: "admin",
    email: null,
    firstName: "Trama",
    lastName: "Admin",
    profileImageUrl: null,
    displayName: ADMIN_USERNAME,
    preferences: {},
  };
  const sid = await createSession({
    user: adminUser,
    access_token: "",
    role: "admin",
    sessionExpiresAt: Date.now() + ADMIN_SESSION_TTL,
  }, ADMIN_SESSION_TTL);
  cookie(res, SESSION_COOKIE, sid, ADMIN_SESSION_TTL);
  res.json({ user: adminUser });
});
router.post("/admin/logout", async (req, res) => {
  await clearSession(res, getSessionId(req));
  res.json({ ok: true });
});
router.get("/profile", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ message: "Sign in to view your saved profile." }); return; }
  const [user] = await db.select({ displayName: usersTable.displayName, preferences: usersTable.preferences }).from(usersTable).where(eq(usersTable.id, req.user.id));
  res.json({ displayName: user?.displayName ?? null, preferences: user?.preferences ?? {} });
});
router.patch("/profile", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ message: "Sign in to save your profile." }); return; }
  const displayName = typeof req.body?.displayName === "string" ? req.body.displayName.trim().slice(0, 15) : undefined;
  const preferences = req.body?.preferences && typeof req.body.preferences === "object" && !Array.isArray(req.body.preferences) ? req.body.preferences : undefined;
  const [user] = await db.update(usersTable).set({ ...(displayName !== undefined ? { displayName } : {}), ...(preferences !== undefined ? { preferences } : {}), updatedAt: new Date() }).where(eq(usersTable.id, req.user.id)).returning();
  res.json({ displayName: user.displayName, preferences: user.preferences });
});
router.get("/login", async (req, res) => {
  const cfg = await oidcConfig(); const state = oidc.randomState(); const nonce = oidc.randomNonce();
  const verifier = oidc.randomPKCECodeVerifier(); const challenge = await oidc.calculatePKCECodeChallenge(verifier);
  cookie(res, "oidc_verifier", verifier); cookie(res, "oidc_nonce", nonce); cookie(res, "oidc_state", state); cookie(res, "oidc_return", returnTo(req.query.returnTo));
  const url = oidc.buildAuthorizationUrl(cfg, { redirect_uri: `${origin(req)}/api/callback`, scope: "openid email profile offline_access", code_challenge: challenge, code_challenge_method: "S256", state, nonce, prompt: "login consent" });
  res.redirect(url.href);
});
router.get("/callback", async (req, res) => {
  const cfg = await oidcConfig(); const callback = `${origin(req)}/api/callback`;
  const verifier = req.cookies?.oidc_verifier; const state = req.cookies?.oidc_state; const nonce = req.cookies?.oidc_nonce;
  if (!verifier || !state) return res.redirect("/api/login");
  try {
    const current = new URL(`${callback}?${new URL(req.url, callback).searchParams}`);
    const tokens = await oidc.authorizationCodeGrant(cfg, current, { pkceCodeVerifier: verifier, expectedState: state, expectedNonce: nonce, idTokenExpected: true });
    const claims = tokens.claims(); if (!claims?.sub) return res.redirect("/api/login");
    const data = { id: claims.sub, email: (claims.email as string) ?? null, firstName: (claims.first_name as string) ?? null, lastName: (claims.last_name as string) ?? null, profileImageUrl: ((claims.profile_image_url ?? claims.picture) as string) ?? null };
    const [user] = await db.insert(usersTable).values(data).onConflictDoUpdate({ target: usersTable.id, set: { ...data, updatedAt: new Date() } }).returning();
    const userData: AuthUser = { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, profileImageUrl: user.profileImageUrl, displayName: user.displayName, preferences: user.preferences };
    const sid = await createSession({ user: userData, access_token: tokens.access_token, refresh_token: tokens.refresh_token, expires_at: tokens.expiresIn() ? Math.floor(Date.now() / 1000) + tokens.expiresIn()! : claims.exp });
    cookie(res, SESSION_COOKIE, sid, SESSION_TTL);
    for (const key of ["oidc_verifier", "oidc_nonce", "oidc_state", "oidc_return"]) res.clearCookie(key, { path: "/" });
    res.redirect(returnTo(req.cookies?.oidc_return));
  } catch { res.redirect("/api/login"); }
});
router.get("/logout", async (req, res) => { await clearSession(res, getSessionId(req)); res.redirect(returnTo(req.query.returnTo)); });
export default router;