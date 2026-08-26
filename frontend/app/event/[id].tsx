import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";

import {
  spacing,
  radius,
  typography,
  shadows,
  getCategoryMeta,
} from "@/src/constants/theme";
import { api, EventItem } from "@/src/lib/api";
import { useAuth } from "@/src/auth/AuthContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { useThemedStyles } from "@/src/theme/useThemedStyles";

const AVATAR = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&w=300&q=80";

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { company } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.getEvent(id);
      setEvent(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onDelete = async () => {
    if (!event) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setDeleting(true);
    try {
      await api.deleteEvent(event.id);
      router.back();
    } catch (e) {
      console.warn(e);
      setDeleting(false);
    }
  };

  if (loading || !event) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.brandPrimary} />
      </SafeAreaView>
    );
  }

  const meta = getCategoryMeta(event.category, company?.categories);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} testID="details-back">
            <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable style={styles.iconBtn}>
            <Ionicons name="share-outline" size={20} color={colors.onSurface} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.hero, { backgroundColor: meta.bg }]}>
          <View style={[styles.categoryChip, { backgroundColor: meta.color }]}>
            <Text style={styles.categoryChipText}>{meta.label}</Text>
          </View>
          <Text style={[styles.title, { color: colors.onSurface }]}>{event.title}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time" size={16} color={colors.onSurface} />
            <Text style={styles.timeText}>
              {dayjs(event.start).format("ddd, MMM D · h:mm A")} →{" "}
              {dayjs(event.end).format("h:mm A")}
            </Text>
          </View>
        </View>

        {!!event.location && (
          <MetaBlock icon="location" title="Location" value={event.location} />
        )}
        {!!event.description && (
          <MetaBlock icon="document-text-outline" title="Notes" value={event.description} />
        )}
        {!!event.assignee && (
          <View style={styles.metaBlock}>
            <View style={styles.metaHeader}>
              <View style={styles.metaIcon}>
                <Ionicons name="people-outline" size={16} color={colors.onSurface} />
              </View>
              <Text style={styles.metaTitle}>Assignee</Text>
            </View>
            <View style={styles.assigneeRow}>
              <Image source={{ uri: AVATAR }} style={styles.avatar} />
              <Text style={styles.assigneeName}>{event.assignee}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.deleteBtn}
          onPress={onDelete}
          disabled={deleting}
          testID="event-delete"
        >
          {deleting ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={styles.deleteText}>Delete event</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function MetaBlock({
  icon,
  title,
  value,
}: {
  icon: any;
  title: string;
  value: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.metaBlock}>
      <View style={styles.metaHeader}>
        <View style={styles.metaIcon}>
          <Ionicons name={icon} size={16} color={colors.onSurface} />
        </View>
        <Text style={styles.metaTitle}>{title}</Text>
      </View>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  hero: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  categoryChip: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  categoryChipText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: typography.xxl,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  timeText: {
    fontSize: typography.base,
    fontWeight: "600",
    color: colors.onSurface,
  },
  metaBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metaIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  metaTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.onSurfaceSecondary,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  metaValue: { fontSize: typography.lg, color: colors.onSurface, lineHeight: 22 },
  assigneeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: 4,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  assigneeName: { fontSize: typography.lg, fontWeight: "600", color: colors.onSurface },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === "ios" ? 34 : spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.errorBg,
  },
  deleteText: { color: colors.error, fontWeight: "800", fontSize: typography.base },
});
