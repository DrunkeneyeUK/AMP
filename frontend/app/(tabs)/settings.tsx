import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { colors, spacing, radius, typography, shadows } from "@/src/constants/theme";

const AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&w=300&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=srgb&fm=jpg&w=300&q=80",
  "https://images.unsplash.com/photo-1506863530036-1efeddceb993?crop=entropy&cs=srgb&fm=jpg&w=300&q=80",
];

export default function SettingsScreen() {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.surface }}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.hero}>
          <Image source={{ uri: AVATARS[0] }} style={styles.avatar} />
          <Text style={styles.name}>You</Text>
          <Text style={styles.email}>daysync@local</Text>
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Ionicons name="flash" size={12} color={colors.onBrandSecondary} />
              <Text style={styles.badgeText}>Focused</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team</Text>
          <View style={styles.card}>
            {AVATARS.map((a, i) => (
              <View
                key={i}
                style={[styles.avatarStack, { marginLeft: i === 0 ? 0 : -12 }]}
              >
                <Image source={{ uri: a }} style={styles.stackImg} />
              </View>
            ))}
            <View style={styles.avatarPlus}>
              <Ionicons name="add" size={18} color={colors.onSurfaceSecondary} />
            </View>
            <View style={{ flex: 1 }} />
            <Text style={styles.link}>Invite</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Row icon="notifications-outline" title="Notifications" subtitle="Reminders for events & tasks" />
          <Row icon="color-palette-outline" title="Appearance" subtitle="Light" />
          <Row icon="time-outline" title="Time zone" subtitle="Auto (device)" />
          <Row icon="lock-closed-outline" title="Privacy" subtitle="Local-first" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Row icon="information-circle-outline" title="DaySync" subtitle="v1.0.0" />
          <Row icon="mail-outline" title="Contact us" subtitle="hello@daysync.app" />
        </View>
      </ScrollView>
    </View>
  );
}

function Row({
  icon,
  title,
  subtitle,
}: {
  icon: any;
  title: string;
  subtitle: string;
}) {
  return (
    <Pressable style={styles.row} testID={`settings-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.onSurface} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.xxl,
    fontWeight: "800",
    color: colors.onSurface,
  },
  hero: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: colors.brandSecondary,
  },
  name: {
    marginTop: spacing.md,
    fontSize: typography.xl,
    fontWeight: "800",
    color: colors.onSurface,
  },
  email: {
    fontSize: typography.sm,
    color: colors.onSurfaceSecondary,
    marginTop: 2,
  },
  badges: { flexDirection: "row", marginTop: spacing.md, gap: spacing.sm },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.onBrandSecondary,
    letterSpacing: 0.3,
  },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: typography.sm,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  avatarStack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.surface,
    overflow: "hidden",
  },
  stackImg: { width: "100%", height: "100%" },
  avatarPlus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.surface,
    marginLeft: -12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  link: { color: colors.brandPrimary, fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: typography.lg, fontWeight: "700", color: colors.onSurface },
  rowSub: {
    fontSize: typography.sm,
    color: colors.onSurfaceSecondary,
    marginTop: 2,
  },
});
