import type { NextFunction, Request, Response } from "express";
import { getSession, getSessionId } from "../lib/auth";

declare global {
  namespace Express {
    interface Request {
      user?: import("../lib/auth").AuthUser;
      isAuthenticated(): this is Request & { user: import("../lib/auth").AuthUser };
      isAdmin(): this is Request & { user: import("../lib/auth").AuthUser; admin: true };
      admin?: true;
    }
  }
}

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.isAuthenticated = function (this: Request): this is Request & { user: import("../lib/auth").AuthUser } { return Boolean(this.user); };
  req.isAdmin = function (this: Request): this is Request & { user: import("../lib/auth").AuthUser; admin: true } { return this.admin === true; };
  const sid = getSessionId(req);
  if (sid) {
    const session = await getSession(sid);
    if (session?.user) {
      req.user = session.user;
      if (session.role === "admin") req.admin = true;
    }
  }
  next();
}