import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";

import { spacing, radius, typography, shadows, getCategoryMeta } from "@/src/constants/theme";
import { api, EventItem, TaskItem } from "@/src/lib/api";
import { buildMonthGrid, monthRangeISO, toISODate, formatTime } from "@/src/lib/date";
import { useAuth } from "@/src/auth/AuthContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { useThemedStyles } from "@/src/theme/useThemedStyles";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function MonthScreen() {
  const router = useRouter();
  const { company } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [month, setMonth] = useState(dayjs());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [sheetEvents, setSheetEvents] = useState<EventItem[]>([]);
  const [sheetTasks, setSheetTasks] = useState<TaskItem[]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);

  const load = useCallback(async (m: dayjs.Dayjs) => {
    setLoading(true);
    const range = monthRangeISO(m);
    try {
      const [ev, tk] = await Promise.all([
        api.listEvents({ start_after: range.start, start_before: range.end }),
        api.listTasks({ due_after: range.start, due_before: range.end }),
      ]);
      setEvents(ev);
      setTasks(tk);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(month);
    }, [load, month])
  );

  const days = buildMonthGrid(month);

  const eventsByDay = new Map<string, EventItem[]>();
  events.forEach((e) => {
    const d = toISODate(new Date(e.start));
    const arr = eventsByDay.get(d) ?? [];
    arr.push(e);
    eventsByDay.set(d, arr);
  });

  const tasksByDay = new Map<string, TaskItem[]>();
  tasks.forEach((t) => {
    if (!t.due_date) return;
    const d = toISODate(new Date(t.due_date));
    const arr = tasksByDay.get(d) ?? [];
    arr.push(t);
    tasksByDay.set(d, arr);
  });

  const catList = company?.categories;

  const openDay = async (iso: string) => {
    Haptics.selectionAsync();
    setSheetDate(iso);
    setSheetLoading(true);
    try {
      const data = await api.agenda(iso);
      setSheetEvents(data.events);
      setSheetTasks(data.tasks);
    } catch (e) {
      console.warn(e);
    } finally {
      setSheetLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => setMonth(month.subtract(1, "month"))}
            style={styles.navBtn}
            testID="month-prev"
          >
            <Ionicons name="chevron-back" size={20} color={colors.onSurface} />
          </Pressable>
          <Pressable
            onPress={() => setMonth(dayjs())}
            testID="month-title-btn"
          >
            <Text style={styles.monthTitle}>{month.format("MMMM YYYY")}</Text>
          </Pressable>
          <Pressable
            onPress={() => setMonth(month.add(1, "month"))}
            style={styles.navBtn}
            testID="month-next"
          >
            <Ionicons name="chevron-forward" size={20} color={colors.onSurface} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAY_LABELS.map((d, i) => (
            <Text key={i} style={styles.weekDay}>
              {d}
            </Text>
          ))}
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : (
        <View style={styles.grid}>
          {days.map((d, idx) => {
            const iso = toISODate(d);
            const inMonth = d.month() === month.month();
            const isToday = iso === toISODate(dayjs());
            const dayEvents = eventsByDay.get(iso) ?? [];
            const dayTasks = tasksByDay.get(iso) ?? [];
            const total = dayEvents.length + dayTasks.length;
            const dots = dayEvents
              .slice(0, 3)
              .map((e) => getCategoryMeta(e.category, catList).color);

            return (
              <Pressable
                key={iso + idx}
                style={styles.dayCell}
                onPress={() => openDay(iso)}
                testID={`month-day-${iso}`}
              >
                <View style={[styles.dayNumWrap, isToday && styles.dayToday]}>
                  <Text
                    style={[
                      styles.dayNumText,
                      !inMonth && styles.dayNumOut,
                      isToday && styles.dayTodayText,
                    ]}
                  >
                    {d.date()}
                  </Text>
                </View>
                <View style={styles.dotsRow}>
                  {dots.map((c, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: c }]} />
                  ))}
                  {dayTasks.length > 0 && (
                    <View style={[styles.dot, { backgroundColor: colors.info }]} />
                  )}
                </View>
                {total > 3 && (
                  <Text style={styles.moreText}>+{total - 3}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      <Modal
        transparent
        visible={sheetDate !== null}
        animationType="slide"
        onRequestClose={() => setSheetDate(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSheetDate(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {sheetDate ? dayjs(sheetDate).format("dddd, MMM D") : ""}
              </Text>
              <Pressable
                onPress={() => {
                  setSheetDate(null);
                  router.push(`/create?date=${sheetDate}` as any);
                }}
                style={styles.sheetAdd}
                testID="sheet-add"
              >
                <Ionicons name="add" size={20} color={colors.onBrandPrimary} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {sheetLoading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={colors.brandPrimary} />
              ) : sheetEvents.length === 0 && sheetTasks.length === 0 ? (
                <View style={styles.sheetEmpty}>
                  <Text style={styles.sheetEmptyText}>Nothing scheduled</Text>
                </View>
              ) : (
                <>
                  {sheetEvents.map((e) => {
                    const m = getCategoryMeta(e.category, catList);
                    return (
                      <Pressable
                        key={e.id}
                        style={styles.sheetItem}
                        onPress={() => {
                          setSheetDate(null);
                          router.push(`/event/${e.id}` as any);
                        }}
                      >
                        <View style={[styles.sheetStripe, { backgroundColor: m.color }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sheetItemTitle}>{e.title}</Text>
                          <Text style={styles.sheetItemMeta}>
                            {formatTime(e.start)} · {m.label}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                  {sheetTasks.map((t) => {
                    const m = getCategoryMeta(t.category, catList);
                    return (
                      <Pressable
                        key={t.id}
                        style={styles.sheetItem}
                        onPress={() => {
                          setSheetDate(null);
                          router.push(`/task/${t.id}` as any);
                        }}
                      >
                        <View style={[styles.sheetStripe, { backgroundColor: colors.info }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sheetItemTitle}>{t.title}</Text>
                          <Text style={styles.sheetItemMeta}>
                            Task · {m.label} · {t.priority}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </>
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    fontSize: typography.xl,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  weekRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: colors.onSurfaceTertiary,
    letterSpacing: 0.5,
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.sm,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 0.85,
    padding: 4,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  dayNumWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  dayToday: { backgroundColor: colors.brandPrimary },
  dayNumText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.onSurface,
  },
  dayNumOut: { color: colors.onSurfaceTertiary, opacity: 0.4 },
  dayTodayText: { color: colors.onBrandPrimary, fontWeight: "800" },
  dotsRow: {
    flexDirection: "row",
    gap: 3,
    marginTop: 4,
    minHeight: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  moreText: { fontSize: 9, color: colors.onSurfaceTertiary, marginTop: 2 },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 34 : spacing.lg,
    paddingTop: spacing.sm,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: typography.xl,
    fontWeight: "800",
    color: colors.onSurface,
  },
  sheetAdd: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetItem: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    alignItems: "center",
  },
  sheetStripe: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  sheetItemTitle: {
    fontSize: typography.lg,
    fontWeight: "600",
    color: colors.onSurface,
  },
  sheetItemMeta: {
    fontSize: typography.sm,
    color: colors.onSurfaceSecondary,
    marginTop: 2,
  },
  sheetEmpty: { alignItems: "center", paddingVertical: spacing.xxl },
  sheetEmptyText: { color: colors.onSurfaceTertiary },
});
