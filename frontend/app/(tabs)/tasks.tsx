import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";

import {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  getCategoryMeta,
} from "@/src/constants/theme";
import { api, TaskItem } from "@/src/lib/api";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
];

export default function TasksScreen() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    try {
      const t = await api.listTasks();
      setTasks(t);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    if (filter === "all") return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  const counts = useMemo(() => {
    return {
      all: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      done: tasks.filter((t) => t.status === "done").length,
    };
  }, [tasks]);

  const cycleStatus = async (t: TaskItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next =
      t.status === "todo"
        ? "in_progress"
        : t.status === "in_progress"
        ? "done"
        : "todo";
    setTasks((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, status: next } : x))
    );
    try {
      await api.updateTask(t.id, { status: next });
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.surface }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Your work</Text>
            <Text style={styles.title}>Tasks</Text>
          </View>
          <View style={styles.headerStats}>
            <Text style={styles.statNum}>{counts.todo + counts.in_progress}</Text>
            <Text style={styles.statLabel}>open</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const c = (counts as any)[f.key];
            return (
              <Pressable
                key={f.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter(f.key);
                }}
                style={[styles.chip, active && styles.chipActive]}
                testID={`task-filter-${f.key}`}
              >
                <Text
                  style={[styles.chipLabel, active && styles.chipLabelActive]}
                >
                  {f.label}
                </Text>
                <View
                  style={[
                    styles.chipCount,
                    active && styles.chipCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipCountText,
                      active && styles.chipCountTextActive,
                    ]}
                  >
                    {c}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.brandPrimary}
          />
        }
      >
        {loading ? (
          <View style={{ paddingTop: 60, alignItems: "center" }}>
            <ActivityIndicator color={colors.brandPrimary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-done" size={36} color={colors.brandPrimary} />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === "done" ? "No completed tasks yet" : "Nothing here yet"}
            </Text>
            <Text style={styles.emptySub}>
              {filter === "done"
                ? "Complete tasks and they'll show up here."
                : "Create your first task to get started."}
            </Text>
            <Pressable
              style={styles.emptyBtn}
              onPress={() => router.push("/create?type=task" as any)}
              testID="empty-create-task"
            >
              <Ionicons name="add" size={18} color={colors.onBrandPrimary} />
              <Text style={styles.emptyBtnText}>New task</Text>
            </Pressable>
          </View>
        ) : (
          filtered.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onToggle={() => cycleStatus(t)}
              onPress={() => router.push(`/task/${t.id}` as any)}
            />
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.fabWrap}>
        <Pressable
          style={styles.fab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/create?type=task" as any);
          }}
          testID="tasks-fab-create"
        >
          <Ionicons name="add" size={30} color={colors.onBrandPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

function TaskCard({
  task,
  onToggle,
  onPress,
}: {
  task: TaskItem;
  onToggle: () => void;
  onPress: () => void;
}) {
  const meta = getCategoryMeta(task.category);
  const done = task.status === "done";
  const inProgress = task.status === "in_progress";
  return (
    <Pressable style={styles.card} onPress={onPress} testID={`task-card-${task.id}`}>
      <Pressable
        onPress={onToggle}
        hitSlop={12}
        style={[
          styles.check,
          inProgress && styles.checkProgress,
          done && styles.checkDone,
        ]}
      >
        {done && <Ionicons name="checkmark" size={16} color="#fff" />}
        {inProgress && <View style={styles.checkProgressInner} />}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.cardTitle, done && styles.cardTitleDone]}
          numberOfLines={2}
        >
          {task.title}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.dotSm, { backgroundColor: meta.color }]} />
          <Text style={styles.metaText}>{meta.label}</Text>
          {task.due_date && (
            <>
              <Text style={styles.metaSep}>·</Text>
              <Ionicons
                name="time-outline"
                size={12}
                color={colors.onSurfaceSecondary}
              />
              <Text style={styles.metaText}>
                {dayjs(task.due_date).format("MMM D, h:mm A")}
              </Text>
            </>
          )}
          {task.assignee ? (
            <>
              <Text style={styles.metaSep}>·</Text>
              <Text style={styles.metaText}>@{task.assignee}</Text>
            </>
          ) : null}
        </View>
      </View>
      {task.priority === "high" && !done && (
        <View style={styles.priorityPill}>
          <Text style={styles.priorityText}>HIGH</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    fontSize: typography.sm,
    color: colors.onSurfaceSecondary,
    fontWeight: "500",
    marginBottom: 2,
  },
  title: {
    fontSize: typography.xxl,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  headerStats: {
    backgroundColor: colors.brandSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  statNum: {
    fontSize: typography.xl,
    fontWeight: "800",
    color: colors.onBrandSecondary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.onBrandSecondary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  chipsRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    gap: 6,
    flexShrink: 0,
  },
  chipActive: {
    backgroundColor: colors.surfaceInverse,
  },
  chipLabel: {
    fontSize: typography.sm,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  chipLabelActive: { color: colors.onSurfaceInverse },
  chipCount: {
    minWidth: 20,
    height: 18,
    paddingHorizontal: 6,
    borderRadius: 9,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chipCountActive: { backgroundColor: colors.brandPrimary },
  chipCountText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.onSurfaceSecondary,
  },
  chipCountTextActive: { color: colors.onBrandPrimary },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  checkProgress: {
    borderColor: colors.warning,
  },
  checkProgressInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.warning,
  },
  checkDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  cardTitle: {
    fontSize: typography.lg,
    fontWeight: "700",
    color: colors.onSurface,
    lineHeight: 22,
  },
  cardTitleDone: {
    textDecorationLine: "line-through",
    color: colors.onSurfaceTertiary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  metaText: { fontSize: typography.sm, color: colors.onSurfaceSecondary },
  metaSep: { color: colors.onSurfaceTertiary },
  dotSm: { width: 6, height: 6, borderRadius: 3 },
  priorityPill: {
    backgroundColor: "#FFD7D4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.error,
    letterSpacing: 0.5,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.xl,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  emptySub: {
    fontSize: typography.base,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  emptyBtn: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  emptyBtnText: {
    color: colors.onBrandPrimary,
    fontWeight: "700",
    fontSize: typography.base,
  },
  fabWrap: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 84,
    right: spacing.lg,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.fab,
  },
});
