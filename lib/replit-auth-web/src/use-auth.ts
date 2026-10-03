import { useCallback, useEffect, useState } from "react";
export interface AuthUser { id: string; email: string | null; firstName: string | null; lastName: string | null; profileImageUrl: string | null; displayName?: string | null; preferences?: unknown; }
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { fetch("/api/auth/user", { credentials: "include" }).then(r => r.json()).then(d => setUser(d.user ?? null)).catch(() => setUser(null)).finally(() => setIsLoading(false)); }, []);
  const login = useCallback(() => { window.location.href = `/api/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`; }, []);
  const logout = useCallback(() => { window.location.href = `/api/logout?returnTo=${encodeURIComponent(window.location.pathname)}`; }, []);
  return { user, isLoading, isAuthenticated: Boolean(user), login, logout };
}