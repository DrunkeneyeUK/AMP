import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { storage } from "@/src/utils/storage";
import { api, CompanyInfo, TOKEN_KEY, UserInfo } from "@/src/lib/api";

type AuthState = {
  user: UserInfo | null;
  company: CompanyInfo | null;
  loading: boolean;
  refresh: () => Promise<void>;
  refreshCompany: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUpAdmin: (body: {
    company_name: string;
    admin_email: string;
    admin_password: string;
    admin_name: string;
    visibility_mode: "shared" | "private";
  }) => Promise<{ invite_code: string }>;
  signUpEmployee: (body: {
    invite_code: string;
    email: string;
    password: string;
    name: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  setCompany: (c: CompanyInfo) => void;
  setUser: (u: UserInfo) => void;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = await storage.secureGet(TOKEN_KEY, "");
    if (!token) {
      setUser(null);
      setCompany(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.me();
      setUser(me);
      setCompany(me.company ?? null);
    } catch (e) {
      console.warn("auth me failed", e);
      await storage.secureRemove(TOKEN_KEY);
      setUser(null);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const refreshCompany = useCallback(async () => {
    try {
      const c = await api.getCompany();
      setCompany(c);
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const persist = async (token: string, u: UserInfo) => {
    await storage.secureSet(TOKEN_KEY, token);
    setUser(u);
    setCompany(u.company ?? null);
  };

  const persistTokenOnly = async (token: string) => {
    await storage.secureSet(TOKEN_KEY, token);
  };

  const signIn = async (email: string, password: string) => {
    const r = await api.login({ email, password });
    await persist(r.access_token, r.user);
  };

  const signUpAdmin: AuthState["signUpAdmin"] = async (body) => {
    const r = await api.registerCompany(body);
    // Persist token but do NOT set user state yet — caller will show the
    // invite-code screen first, then call `refresh()` to enter the app.
    await persistTokenOnly(r.access_token);
    return { invite_code: r.invite_code ?? "" };
  };

  const signUpEmployee: AuthState["signUpEmployee"] = async (body) => {
    const r = await api.joinCompany(body);
    await persist(r.access_token, r.user);
  };

  const signOut = async () => {
    await storage.secureRemove(TOKEN_KEY);
    setUser(null);
    setCompany(null);
  };

  const value = useMemo<AuthState>(
    () => ({
      user,
      company,
      loading,
      refresh,
      refreshCompany,
      signIn,
      signUpAdmin,
      signUpEmployee,
      signOut,
      setCompany,
      setUser,
    }),
    [user, company, loading, refresh, refreshCompany]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
