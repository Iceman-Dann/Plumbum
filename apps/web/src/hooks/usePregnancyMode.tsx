import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface PregnancyModeContextValue {
  isPregnant: boolean;
  setIsPregnant: (val: boolean) => void;
}

const PregnancyModeContext = createContext<PregnancyModeContextValue | null>(null);

const STORAGE_KEY = "plumbum-pregnancy-mode";

export function PregnancyModeProvider({ children }: { children: ReactNode }) {
  const [isPregnant, setIsPregnantState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  const setIsPregnant = (val: boolean) => {
    setIsPregnantState(val);
    localStorage.setItem(STORAGE_KEY, String(val));
  };

  return (
    <PregnancyModeContext.Provider value={{ isPregnant, setIsPregnant }}>
      {children}
    </PregnancyModeContext.Provider>
  );
}

export function usePregnancyMode() {
  const ctx = useContext(PregnancyModeContext);
  if (!ctx) {
    throw new Error("usePregnancyMode must be used within PregnancyModeProvider");
  }
  return ctx;
}
