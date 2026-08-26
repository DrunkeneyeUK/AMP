export type Palette = {
  surface: string;
  onSurface: string;
  surfaceSecondary: string;
  onSurfaceSecondary: string;
  surfaceTertiary: string;
  onSurfaceTertiary: string;
  surfaceInverse: string;
  onSurfaceInverse: string;
  brand: string;
  brandPrimary: string;
  onBrandPrimary: string;
  brandSecondary: string;
  onBrandSecondary: string;
  brandTertiary: string;
  onBrandTertiary: string;
  success: string;
  onSuccess: string;
  warning: string;
  onWarning: string;
  error: string;
  onError: string;
  info: string;
  onInfo: string;
  border: string;
  borderStrong: string;
  divider: string;
  errorBg: string;
};

export const lightPalette: Palette = {
  surface: "#FCFAF8",
  onSurface: "#1C1B1A",
  surfaceSecondary: "#F2EFEB",
  onSurfaceSecondary: "#54524F",
  surfaceTertiary: "#E8E4DF",
  onSurfaceTertiary: "#73706C",
  surfaceInverse: "#262422",
  onSurfaceInverse: "#FFFFFF",
  brand: "#FF6B5C",
  brandPrimary: "#FF6B5C",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#FFDED9",
  onBrandSecondary: "#A32D21",
  brandTertiary: "#FFF1EE",
  onBrandTertiary: "#D63E30",
  success: "#34C759",
  onSuccess: "#FFFFFF",
  warning: "#FFB340",
  onWarning: "#4D3000",
  error: "#FF453A",
  onError: "#FFFFFF",
  info: "#32ADE6",
  onInfo: "#FFFFFF",
  border: "#E0DDD8",
  borderStrong: "#C7C3BD",
  divider: "#EBE8E4",
  errorBg: "#FFD7D4",
};

export const darkPalette: Palette = {
  surface: "#141312",
  onSurface: "#F2EFEB",
  surfaceSecondary: "#1F1D1C",
  onSurfaceSecondary: "#A6A29E",
  surfaceTertiary: "#2E2B29",
  onSurfaceTertiary: "#8C8985",
  surfaceInverse: "#FCFAF8",
  onSurfaceInverse: "#1C1B1A",
  brand: "#FF8578",
  brandPrimary: "#FF8578",
  onBrandPrimary: "#2E0E0A",
  brandSecondary: "#521812",
  onBrandSecondary: "#FFD4CF",
  brandTertiary: "#330F0B",
  onBrandTertiary: "#FFAEA6",
  success: "#30D158",
  onSuccess: "#000000",
  warning: "#FFD60A",
  onWarning: "#000000",
  error: "#FF453A",
  onError: "#000000",
  info: "#64D2FF",
  onInfo: "#000000",
  border: "#2E2B29",
  borderStrong: "#4A4642",
  divider: "#1F1D1C",
  errorBg: "#3B1815",
};

// Legacy static export (light palette) — new code should use useTheme()
export const colors = lightPalette;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const typography = {
  displayFont: "System",
  textFont: "System",
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  fab: {
    shadowColor: "#FF6B5C",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
};

export type CategoryDef = {
  key: string;
  label: string;
  color: string;
  bg: string;
  icon?: string;
};

// Fallback defaults; the real list comes from the company config.
export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { key: "work", label: "Work", color: "#FF6B5C", bg: "#FFDED9", icon: "briefcase" },
  { key: "meeting", label: "Meeting", color: "#32ADE6", bg: "#D6EEFA", icon: "people" },
  { key: "deadline", label: "Deadline", color: "#FF453A", bg: "#FFD7D4", icon: "flag" },
  { key: "personal", label: "Personal", color: "#34C759", bg: "#D6F5DE", icon: "heart" },
  { key: "focus", label: "Focus", color: "#FFB340", bg: "#FFEBCC", icon: "bulb" },
];

// Icons available for the admin category picker
export const CATEGORY_ICONS = [
  "briefcase", "people", "flag", "heart", "bulb",
  "calendar", "alarm", "star", "home", "business",
  "chatbubbles", "call", "mail", "megaphone", "shield-checkmark",
  "code-slash", "hammer", "cash", "cart", "gift",
  "book", "school", "cafe", "restaurant", "fitness",
  "airplane", "car", "bicycle", "boat", "walk",
  "musical-notes", "camera", "film", "game-controller", "trophy",
  "medkit", "bed", "leaf", "flame", "flash",
  "rocket", "trending-up", "pie-chart", "wallet", "receipt",
];

// Legacy: kept so old imports don't crash. Prefer useCategories() from AuthContext.
export const CATEGORIES = DEFAULT_CATEGORIES;

export const PRIORITIES: {
  key: "low" | "medium" | "high";
  label: string;
  color: string;
}[] = [
  { key: "low", label: "Low", color: "#73706C" },
  { key: "medium", label: "Medium", color: "#FFB340" },
  { key: "high", label: "High", color: "#FF453A" },
];

export function getCategoryMeta(key: string, categories?: CategoryDef[]) {
  const list = categories && categories.length ? categories : DEFAULT_CATEGORIES;
  return list.find((c) => c.key === key) ?? list[0];
}

// Utility: convert hex to a tinted background for dark backgrounds too.
export function tintBg(hex: string, isDark = false): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (isDark) {
    // dark tint at 20% saturation
    const rr = Math.round(r * 0.25 + 20 * 0.75);
    const gg = Math.round(g * 0.25 + 20 * 0.75);
    const bb = Math.round(b * 0.25 + 20 * 0.75);
    return `#${rr.toString(16).padStart(2, "0")}${gg.toString(16).padStart(2, "0")}${bb.toString(16).padStart(2, "0")}`;
  }
  const rr = Math.round(r * 0.15 + 255 * 0.85);
  const gg = Math.round(g * 0.15 + 255 * 0.85);
  const bb = Math.round(b * 0.15 + 255 * 0.85);
  return `#${rr.toString(16).padStart(2, "0")}${gg.toString(16).padStart(2, "0")}${bb.toString(16).padStart(2, "0")}`;
}
