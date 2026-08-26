import { useCallback, useEffect, useState } from "react";
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
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";

import { spacing, radius, typography, shadows, getCategoryMeta } from "@/src/constants/theme";
import { api, EventItem, TaskItem } from "@/src/lib/api";
import { formatTime, toISODate } from "@/src/lib/date";
import { useAuth } from "@/src/auth/AuthContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { useThemedStyles } from "@/src/theme/useThemedStyles";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function TodayScreen() {
  const router = useRouter();
  const { user, company } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const brand = company?.brand_color ?? colors.brandPrimary;
  const [selectedDate, setSelectedDate] = useState<string>(toISODate(new Date()));
  const [events, setEvents] = useState<EventItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (date: string) => {
    try {
      const data = await api.agenda(date);
      setEvents(data.events);
      setTasks(data.tasks);
    } catch (e) {
      console.warn("agenda load failed", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(selectedDate);
    }, [load, selectedDate])
  );

  useEffect(() => {
    load(selectedDate);
  }, [load, selectedDate]);

  const onRefresh = () => {
    setRefreshing(true);
    load(selectedDate);
  };

  // Build a 14-day tape starting 3 days before today
  const today = dayjs();
  const days = Array.from({ length: 14 }, (_, i) => today.add(i - 3, "day"));

  const toggleTask = async (t: TaskItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = t.status === "done" ? "todo" : "done";
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
    try {
      await api.updateTask(t.id, { status: next });
    } catch (e) {
      console.warn(e);
    }
  };

  const hasContent = events.length > 0 || tasks.length > 0;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 }}>
            {company?.logo_url ? (
              <Image
                source={{ uri: company.logo_url }}
                style={[styles.brandLogo, { borderColor: brand }]}
                contentFit="contain"
              />
            ) : (
              <View style={[styles.brandLogo, { backgroundColor: brand, borderColor: brand, alignItems: "center", justifyContent: "center" }]}>
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
                  {(company?.name ?? "D").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.hello} testID="today-greeting">
                {greeting()}, {user?.name?.split(" ")[0] ?? "there"}
              </Text>
              <Text style={styles.title} testID="today-date-title" numberOfLines={1}>
                {dayjs(selectedDate).format("dddd, MMM D")}
              </Text>
            </View>
          </View>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: user?.color ?? colors.surfaceSecondary }]}
            onPress={() => router.push("/(tabs)/settings" as any)}
            testID="header-profile-btn"
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>
              {(user?.name ?? "?").charAt(0).toUpperCase()}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateTape}
          testID="date-tape"
        >
          {days.map((d) => {
            const iso = toISODate(d);
            const isSelected = iso === selectedDate;
            const isToday = iso === toISODate(today);
            return (
              <Pressable
                key={iso}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedDate(iso);
                }}
                style={[
                  styles.dayCell,
                  isSelected && { backgroundColor: brand },
                ]}
                testID={`date-cell-${iso}`}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    isSelected && styles.dayLabelSelected,
                  ]}
                >
                  {WEEKDAYS[d.day()]}
                </Text>
                <Text
                  style={[
                    styles.dayNum,
                    isSelected && styles.dayNumSelected,
                  ]}
                >
                  {d.date()}
                </Text>
                {isToday && !isSelected && <View style={[styles.todayDot, { backgroundColor: brand }]} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />
        }
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.brandPrimary} size="large" />
          </View>
        ) : !hasContent ? (
          <EmptyDay
            onCreate={() => router.push("/create" as any)}
          />
        ) : (
          <>
            {events.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Events</Text>
                {events.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    onPress={() => router.push(`/event/${e.id}` as any)}
                  />
                ))}
              </View>
            )}

            {tasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tasks</Text>
                {tasks.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    onToggle={() => toggleTask(t)}
                    onPress={() => router.push(`/task/${t.id}` as any)}
                  />
                ))}
              </View>
            )}
            <View style={{ height: 120 }} />
          </>
        )}
      </ScrollView>

      <View style={styles.fabWrap}>
        <Pressable
          style={styles.fab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push(`/create?date=${selectedDate}` as any);
          }}
          testID="today-fab-create"
        >
          <Ionicons name="add" size={30} color={colors.onBrandPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function EventCard({ event, onPress }: { event: EventItem; onPress: () => void }) {
  const { company } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const meta = getCategoryMeta(event.category, company?.categories);
  const stripeColor = event.owner_color || meta.color;
  return (
    <Pressable
      style={styles.eventCard}
      onPress={onPress}
      testID={`event-card-${event.id}`}
    >
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />
      <View style={styles.eventBody}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTime}>
            {formatTime(event.start)} → {formatTime(event.end)}
          </Text>
          <View style={[styles.chip, { backgroundColor: meta.bg }]}>
            <Text style={[styles.chipText, { color: meta.color }]}>
              {meta.label}
            </Text>
          </View>
        </View>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        {!!event.location && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={colors.onSurfaceSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        )}
        {!!event.owner_name && (
          <View style={styles.metaRow}>
            <View style={[styles.ownerDot, { backgroundColor: stripeColor }]} />
            <Text style={styles.metaText}>{event.owner_name}</Text>
            {!!event.assignee && (
              <>
                <Text style={styles.metaSep}>·</Text>
                <Text style={styles.metaText}>→ {event.assignee}</Text>
              </>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

function TaskRow({
  task,
  onToggle,
  onPress,
}: {
  task: TaskItem;
  onToggle: () => void;
  onPress: () => void;
}) {
  const { company } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const meta = getCategoryMeta(task.category, company?.categories);
  const done = task.status === "done";
  return (
    <Pressable style={styles.taskRow} onPress={onPress} testID={`task-row-${task.id}`}>
      <Pressable
        hitSlop={12}
        onPress={onToggle}
        style={[styles.check, done && styles.checkDone]}
        testID={`task-toggle-${task.id}`}
      >
        {done && <Ionicons name="checkmark" size={16} color="#fff" />}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.taskTitle, done && styles.taskDone]}
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
              <Text style={styles.metaText}>{formatTime(task.due_date)}</Text>
            </>
          )}
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

function EmptyDay({ onCreate }: { onCreate: () => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.empty}>
      <Image
        source={{
          uri: "https://images.unsplash.com/photo-1604782206219-3b9576575203?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
        }}
        style={styles.emptyImage}
        contentFit="cover"
      />
      <Text style={styles.emptyTitle}>All clear today</Text>
      <Text style={styles.emptySub}>Nothing on your plate yet. Ready to plan?</Text>
      <Pressable style={styles.emptyCta} onPress={onCreate} testID="empty-plan-btn">
        <Ionicons name="add" size={18} color={colors.onBrandPrimary} />
        <Text style={styles.emptyCtaText}>Plan something</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  headerSafe: { backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hello: {
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 2,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  ownerDot: { width: 8, height: 8, borderRadius: 4 },
  dateTape: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  dayCell: {
    width: 52,
    height: 68,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    flexShrink: 0,
  },
  dayCellSelected: {
    backgroundColor: colors.surfaceInverse,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
    letterSpacing: 0.5,
  },
  dayLabelSelected: { color: colors.onSurfaceInverse, opacity: 0.7 },
  dayNum: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.onSurface,
  },
  dayNumSelected: { color: colors.onSurfaceInverse },
  todayDot: {
    position: "absolute",
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brandPrimary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  loadingWrap: {
    paddingTop: 80,
    alignItems: "center",
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sm,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  stripe: { width: 6 },
  eventBody: {
    flex: 1,
    padding: spacing.lg,
    gap: 6,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eventTime: {
    fontSize: typography.sm,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
    letterSpacing: 0.3,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  chipText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.4 },
  eventTitle: {
    fontSize: typography.lg,
    fontWeight: "700",
    color: colors.onSurface,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  metaText: { fontSize: typography.sm, color: colors.onSurfaceSecondary },
  metaSep: { color: colors.onSurfaceTertiary, marginHorizontal: 2 },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
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
  checkDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  taskTitle: {
    fontSize: typography.lg,
    fontWeight: "600",
    color: colors.onSurface,
  },
  taskDone: {
    textDecorationLine: "line-through",
    color: colors.onSurfaceTertiary,
  },
  dotSm: { width: 6, height: 6, borderRadius: 3 },
  priorityPill: {
    backgroundColor: "#FFD7D4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  priorityText: { fontSize: 10, fontWeight: "800", color: colors.error, letterSpacing: 0.5 },
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
  empty: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyImage: {
    width: 220,
    height: 180,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.xl,
    fontWeight: "800",
    color: colors.onSurface,
  },
  emptySub: {
    fontSize: typography.base,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  emptyCta: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  emptyCtaText: {
    color: colors.onBrandPrimary,
    fontWeight: "700",
    fontSize: typography.base,
  },
});
