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
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";

import {
  spacing,
  radius,
  typography,
  shadows,
  getCategoryMeta,
  PRIORITIES,
} from "@/src/constants/theme";
import { api, TaskItem } from "@/src/lib/api";
import { useAuth } from "@/src/auth/AuthContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { useThemedStyles } from "@/src/theme/useThemedStyles";

const STATUS_CYCLE: Record<TaskItem["status"], TaskItem["status"]> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

const STATUS_LABEL: Record<TaskItem["status"], string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Completed",
};

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { company } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [task, setTask] = useState<TaskItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.getTask(id);
      setTask(data);
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

  const cycleStatus = async () => {
    if (!task) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = STATUS_CYCLE[task.status];
    setTask({ ...task, status: next });
    try {
      await api.updateTask(task.id, { status: next });
    } catch (e) {
      console.warn(e);
    }
  };

  const onDelete = async () => {
    if (!task) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setDeleting(true);
    try {
      await api.deleteTask(task.id);
      router.back();
    } catch (e) {
      console.warn(e);
      setDeleting(false);
    }
  };

  if (loading || !task) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.brandPrimary} />
      </SafeAreaView>
    );
  }

  const meta = getCategoryMeta(task.category, company?.categories);
  const p = PRIORITIES.find((x) => x.key === task.priority) ?? PRIORITIES[1];
  const done = task.status === "done";

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} testID="task-back">
            <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.chipsWrap}>
          <View style={[styles.chip, { backgroundColor: meta.bg }]}>
            <View style={[styles.dot, { backgroundColor: meta.color }]} />
            <Text style={[styles.chipText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.surfaceSecondary }]}>
            <View style={[styles.dot, { backgroundColor: p.color }]} />
            <Text style={[styles.chipText, { color: p.color }]}>
              {p.label} priority
            </Text>
          </View>
        </View>

        <Text style={[styles.title, done && styles.titleDone]}>{task.title}</Text>

        {task.due_date && (
          <View style={styles.timeRow}>
            <Ionicons name="time" size={16} color={colors.onSurfaceSecondary} />
            <Text style={styles.timeText}>
              Due {dayjs(task.due_date).format("dddd, MMM D · h:mm A")}
            </Text>
          </View>
        )}

        {!!task.description && (
          <View style={styles.notesBlock}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{task.description}</Text>
          </View>
        )}

        {!!task.assignee && (
          <View style={styles.notesBlock}>
            <Text style={styles.notesLabel}>Assignee</Text>
            <Text style={styles.notesText}>@{task.assignee}</Text>
          </View>
        )}

        <Pressable
          onPress={cycleStatus}
          style={[
            styles.statusBtn,
            done && { backgroundColor: colors.success },
            task.status === "in_progress" && { backgroundColor: colors.warning },
          ]}
          testID="cycle-status"
        >
          <Ionicons
            name={
              done
                ? "checkmark-circle"
                : task.status === "in_progress"
                ? "play-circle"
                : "ellipse-outline"
            }
            size={22}
            color="#fff"
          />
          <Text style={styles.statusText}>
            {STATUS_LABEL[task.status]}
          </Text>
          <Text style={styles.statusHint}>Tap to advance</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.deleteBtn}
          onPress={onDelete}
          disabled={deleting}
          testID="task-delete"
        >
          {deleting ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={styles.deleteText}>Delete task</Text>
            </>
          )}
        </Pressable>
      </View>
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
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  chipsWrap: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 30,
    borderRadius: radius.pill,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontWeight: "700", fontSize: typography.sm },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.5,
    marginTop: spacing.lg,
    lineHeight: 34,
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: colors.onSurfaceTertiary,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
  },
  timeText: {
    fontSize: typography.base,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
  },
  notesBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.onSurfaceSecondary,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  notesText: { fontSize: typography.lg, color: colors.onSurface, lineHeight: 22 },
  statusBtn: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surfaceInverse,
    alignItems: "center",
    ...shadows.card,
  },
  statusText: {
    color: "#fff",
    fontSize: typography.xl,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  statusHint: {
    color: "#fff",
    opacity: 0.7,
    fontSize: typography.sm,
    marginTop: 4,
  },
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
