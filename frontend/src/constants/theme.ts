export const colors = {
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
};

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

// Category color map
export const CATEGORIES: {
  key: string;
  label: string;
  color: string;
  bg: string;
}[] = [
  { key: "work", label: "Work", color: "#FF6B5C", bg: "#FFDED9" },
  { key: "meeting", label: "Meeting", color: "#32ADE6", bg: "#D6EEFA" },
  { key: "deadline", label: "Deadline", color: "#FF453A", bg: "#FFD7D4" },
  { key: "personal", label: "Personal", color: "#34C759", bg: "#D6F5DE" },
  { key: "focus", label: "Focus", color: "#FFB340", bg: "#FFEBCC" },
];

export const PRIORITIES: {
  key: "low" | "medium" | "high";
  label: string;
  color: string;
}[] = [
  { key: "low", label: "Low", color: "#73706C" },
  { key: "medium", label: "Medium", color: "#FFB340" },
  { key: "high", label: "High", color: "#FF453A" },
];

export function getCategoryMeta(key: string) {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];
}
