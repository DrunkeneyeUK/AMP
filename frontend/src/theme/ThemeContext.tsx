import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useColorScheme, Appearance } from "react-native";
import { storage } from "@/src/utils/storage";
import { darkPalette, lightPalette, Palette } from "@/src/constants/theme";

export type ThemeMode = "system" | "light" | "dark";
const KEY = "daysync.theme_mode";

type ThemeState = {
  mode: ThemeMode;
  isDark: boolean;
  colors: Palette;
  setMode: (m: ThemeMode) => Promise<void>;
};

const ThemeCtx = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem(KEY, "system" as ThemeMode);
      if (saved === "light" || saved === "dark" || saved === "system") {
        setModeState(saved);
      }
      setReady(true);
    })();
  }, []);

  // Listen for OS color scheme changes when in system mode
  useEffect(() => {
    const sub = Appearance.addChangeListener(() => {
      // force re-render by no-op set
      if (mode === "system") setModeState("system");
    });
    return () => sub.remove();
  }, [mode]);

  const isDark = mode === "system" ? system === "dark" : mode === "dark";
  const colors = isDark ? darkPalette : lightPalette;

  const setMode = useCallback(async (m: ThemeMode) => {
    setModeState(m);
    await storage.setItem(KEY, m);
  }, []);

  const value = useMemo<ThemeState>(
    () => ({ mode, isDark, colors, setMode }),
    [mode, isDark, colors, setMode]
  );

  if (!ready) return null;
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
