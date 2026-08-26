import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

import { colors, spacing, radius, typography, shadows } from "@/src/constants/theme";
import { useAuth } from "@/src/auth/AuthContext";
import { api, UserInfo } from "@/src/lib/api";

const USER_COLORS = [
  "#FF6B5C", "#FF3B30", "#FF9500", "#FFCC00",
  "#34C759", "#00C7BE", "#32ADE6", "#5856D6",
  "#AF52DE", "#FF2D55",
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, company, signOut, refresh } = useAuth();
  const [members, setMembers] = useState<UserInfo[]>([]);
  const [savingColor, setSavingColor] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await api.listUsers();
        setMembers(list);
      } catch (e) {
        console.warn(e);
      }
    })();
  }, []);

  const pickColor = async (c: string) => {
    if (savingColor) return;
    Haptics.selectionAsync();
    setSavingColor(true);
    try {
      await api.updateMe({ color: c });
      await refresh();
    } catch (e) {
      console.warn(e);
    } finally {
      setSavingColor(false);
    }
  };

  const onLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await signOut();
  };

  if (!user) return null;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.surface }}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: user.color }]}>
            <Text style={styles.avatarInitial}>
              {(user.name || user.email).charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons
              name={user.role === "admin" ? "shield-checkmark" : "person"}
              size={12}
              color={colors.onBrandSecondary}
            />
            <Text style={styles.roleText}>{user.role}</Text>
          </View>
        </View>

        {/* Company card */}
        {company && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company</Text>
            <View style={[styles.companyCard, { borderColor: company.brand_color }]}>
              {company.logo_url ? (
                <Image
                  source={{ uri: company.logo_url }}
                  style={styles.companyLogo}
                  contentFit="contain"
                />
              ) : (
                <View style={[styles.companyLogoFallback, { backgroundColor: company.brand_color }]}>
                  <Text style={styles.companyInitial}>
                    {company.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.companyName}>{company.name}</Text>
                <Text style={styles.companyMeta}>
                  {company.visibility_mode === "shared" ? "Shared team calendar" : "Private calendars"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* User color picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your color</Text>
          <View style={styles.card}>
            <Text style={styles.cardSub}>
              How your events and tasks appear on the shared calendar.
            </Text>
            <View style={styles.colorRow}>
              {USER_COLORS.map((c) => {
                const active = c.toLowerCase() === user.color.toLowerCase();
                return (
                  <Pressable
                    key={c}
                    onPress={() => pickColor(c)}
                    style={[styles.swatch, { backgroundColor: c }, active && styles.swatchActive]}
                    testID={`user-color-${c.replace('#','')}`}
                  >
                    {active && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </Pressable>
                );
              })}
              {savingColor && (
                <ActivityIndicator size="small" color={colors.brandPrimary} />
              )}
            </View>
          </View>
        </View>

        {/* Team members */}
        {members.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Team ({members.length})</Text>
            <View style={styles.card}>
              {members.map((m, i) => (
                <View
                  key={m.id}
                  style={[
                    styles.member,
                    i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider },
                  ]}
                >
                  <View style={[styles.memberDot, { backgroundColor: m.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>
                      {m.name}
                      {m.id === user.id ? " (you)" : ""}
                    </Text>
                    <Text style={styles.memberEmail}>{m.email}</Text>
                  </View>
                  {m.role === "admin" && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>ADMIN</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Admin link */}
        {user.role === "admin" && (
          <View style={styles.section}>
            <Pressable
              style={styles.adminLink}
              onPress={() => router.push("/admin" as any)}
              testID="open-admin"
            >
              <View style={styles.adminLinkIcon}>
                <Ionicons name="settings" size={20} color={colors.onBrandPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.adminLinkTitle}>Admin settings</Text>
                <Text style={styles.adminLinkSub}>
                  Logo, brand color, invite code, and team
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceTertiary} />
            </Pressable>
          </View>
        )}

        {/* Sign out */}
        <View style={styles.section}>
          <Pressable style={styles.logoutBtn} onPress={onLogout} testID="logout-btn">
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text style={styles.logoutText}>Sign out</Text>
          </Pressable>
        </View>

        <Text style={styles.version}>DaySync · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: { fontSize: typography.xxl, fontWeight: "800", color: colors.onSurface },
  hero: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  avatarInitial: { color: "#fff", fontSize: 42, fontWeight: "800" },
  name: {
    marginTop: spacing.md,
    fontSize: typography.xl,
    fontWeight: "800",
    color: colors.onSurface,
  },
  email: { fontSize: typography.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.onBrandSecondary,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.onSurfaceSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  companyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    ...shadows.card,
  },
  companyLogo: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  companyLogoFallback: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  companyInitial: { color: "#fff", fontSize: 24, fontWeight: "800" },
  companyName: { fontSize: typography.lg, fontWeight: "800", color: colors.onSurface },
  companyMeta: { fontSize: typography.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSub: {
    fontSize: typography.sm,
    color: colors.onSurfaceSecondary,
    marginBottom: spacing.md,
  },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchActive: { borderColor: colors.onSurface },
  member: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  memberDot: { width: 12, height: 12, borderRadius: 6 },
  memberName: { fontSize: typography.base, fontWeight: "700", color: colors.onSurface },
  memberEmail: { fontSize: typography.sm, color: colors.onSurfaceSecondary },
  adminBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.brandSecondary,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.onBrandSecondary,
    letterSpacing: 0.5,
  },
  adminLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceInverse,
    ...shadows.card,
  },
  adminLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  adminLinkTitle: {
    fontSize: typography.lg,
    fontWeight: "800",
    color: colors.onSurfaceInverse,
  },
  adminLinkSub: {
    fontSize: typography.sm,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "#FFD7D4",
  },
  logoutText: { color: colors.error, fontWeight: "800", fontSize: typography.base },
  version: {
    textAlign: "center",
    color: colors.onSurfaceTertiary,
    fontSize: typography.sm,
    marginTop: spacing.md,
  },
});
