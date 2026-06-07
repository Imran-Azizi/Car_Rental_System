"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Language } from "./translations";
import { translations } from "./translations";
import { authAPI } from "./api";

interface AppContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof translations.dari;
  isRTL: boolean;
  user: any;
  setUser: (u: any) => void;
  token: string | null;
  setToken: (t: string | null) => void;
  isHydrated: boolean;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("dari");
  const [user, setUser] = useState<any>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as Language;
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedLang) setLangState(savedLang);
    if (savedToken) setTokenState(savedToken);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    }
    setIsHydrated(true);
  }, []);

  // Auto-refresh token every 23 hours to extend session
  useEffect(() => {
    if (!token) return;
    const timer = setInterval(
      async () => {
        try {
          const res = await authAPI.refresh();
          const newToken = res.data.data?.token;
          if (newToken) {
            setTokenState(newToken);
            localStorage.setItem("token", newToken);
          }
        } catch {
          setTokenState(null);
          setUser(null);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      },
      23 * 60 * 60 * 1000,
    );
    return () => clearInterval(timer);
  }, [token]);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  const setToken = (t: string | null) => {
    setTokenState(t);
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
  };

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {}
    setTokenState(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t: translations[lang],
        isRTL: true,
        user,
        setUser,
        token,
        setToken,
        isHydrated,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
