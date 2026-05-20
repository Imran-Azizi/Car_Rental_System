'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Language } from './translations';
import { translations } from './translations';

interface AppContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof translations.dari;
  isRTL: boolean;
  user: any;
  setUser: (u: any) => void;
  token: string | null;
  setToken: (t: string | null) => void;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('dari');
  const [user, setUser] = useState<any>(null);
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as Language;
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedLang) setLangState(savedLang);
    if (savedToken) setTokenState(savedToken);
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  const setToken = (t: string | null) => {
    setTokenState(t);
    if (t) localStorage.setItem('token', t);
    else localStorage.removeItem('token');
  };

  return (
    <AppContext.Provider value={{
      lang, setLang, t: translations[lang], isRTL: true,
      user, setUser, token, setToken
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
