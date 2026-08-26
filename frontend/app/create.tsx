import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";

import {
  spacing,
  radius,
  typography,
  shadows,
  DEFAULT_CATEGORIES,
  PRIORITIES,
} from "@/src/constants/theme";
import { api } from "@/src/lib/api";
import { useAuth } from "@/src/auth/AuthContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { useThemedStyles } from "@/src/theme/useThemedStyles";

type Mode = "event" | "task";

export default function CreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; type?: string }>();
  const { company } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const initialType = (params.type as Mode) === "task" ? "task" : "event";
  const categories = company?.categories?.length ? company.categories : DEFAULT_CATEGORIES;

  const [mode, setMode] = useState<Mode>(initialType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [assignee, setAssignee] = useState("");
  const [category, setCategory] = useState(categories[0].key);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [saving, setSaving] = useState(false);

  const baseDate = useMemo(() => {
    if (params.date) return dayjs(params.date as string);
    return dayjs();
  }, [params.date]);

  const [startTime, setStartTime] = useState(
    baseDate.hour(9).minute(0).second(0).toISOString()
  );
  const [endTime, setEndTime] = useState(
    baseDate.hour(10).minute(0).second(0).toISOString()
  );
  const [dueTime, setDueTime] = useState(
    baseDate.hour(17).minute(0).second(0).toISOString()
  );

  const TIME_SLOTS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  const submit = async () => {
    if (!title.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      if (mode === "event") {
        await api.createEvent({
          title: title.trim(),
          description,
          start: startTime,
          end: endTime,
          location,
          assignee,
          category,
          color: categories.find((c) => c.key === category)?.color ?? "#FF6B5C",
        });
      } else {
        await api.createTask({
          title: title.trim(),
          description,
          due_date: dueTime,
          priority,
          status: "todo",
          category,
          assignee,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      console.warn(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.iconBtn}
            testID="create-close"
          >
            <Ionicons name="close" size={22} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.headerTitle}>New {mode}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.segmentWrap}>
          <View style={styles.segment}>
            {(["event", "task"] as Mode[]).map((m) => {
              const active = mode === m;
              return (
                <Pressable
                  key={m}
                  style={[styles.segItem, active && styles.segItemActive]}
                  onPress={() => setMode(m)}
                  testID={`segment-${m}`}
                >
                  <Ionicons
                    name={m === "event" ? "calendar-outline" : "checkbox-outline"}
                    size={16}
                    color={active ? colors.onBrandPrimary : colors.onSurfaceSecondary}
                  />
                  <Text
                    style={[
                      styles.segLabel,
                      active && styles.segLabelActive,
                    ]}
                  >
                    {m === "event" ? "Event" : "Task"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <Field label="Title">
            <TextInput
              placeholder={mode === "event" ? "Team standup" : "Draft proposal"}
              placeholderTextColor={colors.onSurfaceTertiary}
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              testID="input-title"
            />
          </Field>

          <Field label="Notes">
            <TextInput
              placeholder="Add details..."
              placeholderTextColor={colors.onSurfaceTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              style={[styles.input, styles.textarea]}
              testID="input-description"
            />
          </Field>

          <Field label="Category">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {categories.map((c) => {
                const active = category === c.key;
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCategory(c.key);
                    }}
                    style={[
                      styles.catChip,
                      { backgroundColor: active ? c.color : c.bg },
                    ]}
                    testID={`cat-${c.key}`}
                  >
                    <Ionicons
                      name={(c.icon || "briefcase") as any}
                      size={14}
                      color={active ? "#fff" : c.color}
                    />
                    <Text
                      style={[
                        styles.catText,
                        { color: active ? "#fff" : c.color },
                      ]}
                    >
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Field>

          {mode === "event" ? (
            <>
              <Field label={`Start · ${dayjs(startTime).format("ddd, MMM D")}`}>
                <TimePicker
                  slots={TIME_SLOTS}
                  value={startTime}
                  onChange={(iso) => {
                    setStartTime(iso);
                    // shift end to be at least 1hr later
                    if (dayjs(endTime).diff(iso, "minute") < 30) {
                      setEndTime(dayjs(iso).add(1, "hour").toISOString());
                    }
                  }}
                  baseDate={baseDate}
                />
              </Field>

              <Field label={`End · ${dayjs(endTime).format("ddd, MMM D")}`}>
                <TimePicker
                  slots={TIME_SLOTS}
                  value={endTime}
                  onChange={setEndTime}
                  baseDate={baseDate}
                />
              </Field>

              <Field label="Location">
                <TextInput
                  placeholder="Room 4B, Zoom link…"
                  placeholderTextColor={colors.onSurfaceTertiary}
                  value={location}
                  onChangeText={setLocation}
                  style={styles.input}
                  testID="input-location"
                />
              </Field>
            </>
          ) : (
            <>
              <Field label={`Due · ${dayjs(dueTime).format("ddd, MMM D")}`}>
                <TimePicker
                  slots={TIME_SLOTS}
                  value={dueTime}
                  onChange={setDueTime}
                  baseDate={baseDate}
                />
              </Field>

              <Field label="Priority">
                <View style={styles.priorityRow}>
                  {PRIORITIES.map((p) => {
                    const active = priority === p.key;
                    return (
                      <Pressable
                        key={p.key}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setPriority(p.key);
                        }}
                        style={[
                          styles.priorityBtn,
                          active && {
                            backgroundColor: p.color,
                            borderColor: p.color,
                          },
                        ]}
                        testID={`priority-${p.key}`}
                      >
                        <Text
                          style={[
                            styles.priorityLabel,
                            active && { color: "#fff" },
                          ]}
                        >
                          {p.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Field>
            </>
          )}

          <Field label="Assignee">
            <TextInput
              placeholder="Type a name..."
              placeholderTextColor={colors.onSurfaceTertiary}
              value={assignee}
              onChangeText={setAssignee}
              style={styles.input}
              testID="input-assignee"
            />
          </Field>

          <View style={{ height: 80 }} />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.saveBtn, (!title.trim() || saving) && styles.saveBtnDisabled]}
            onPress={submit}
            disabled={!title.trim() || saving}
            testID="save-btn"
          >
            {saving ? (
              <ActivityIndicator color={colors.onBrandPrimary} />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color={colors.onBrandPrimary} />
                <Text style={styles.saveText}>Save {mode}</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function TimePicker({
  slots,
  value,
  onChange,
  baseDate,
}: {
  slots: number[];
  value: string;
  onChange: (iso: string) => void;
  baseDate: dayjs.Dayjs;
}) {
  const styles = useThemedStyles(makeStyles);
  const currentHour = dayjs(value).hour();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {slots.map((h) => {
        const active = currentHour === h;
        return (
          <Pressable
            key={h}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(baseDate.hour(h).minute(0).second(0).toISOString());
            }}
            style={[styles.timeChip, active && styles.timeChipActive]}
            testID={`time-${h}`}
          >
            <Text
              style={[styles.timeText, active && styles.timeTextActive]}
            >
              {dayjs().hour(h).minute(0).format("h A")}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: "700",
    color: colors.onSurface,
    textTransform: "capitalize",
  },
  segmentWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    padding: 4,
  },
  segItem: {
    flex: 1,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: radius.pill,
  },
  segItemActive: {
    backgroundColor: colors.brandPrimary,
  },
  segLabel: {
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
    fontSize: typography.base,
  },
  segLabelActive: { color: colors.onBrandPrimary },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  field: { marginBottom: spacing.lg },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.onSurfaceSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.lg,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: spacing.md,
  },
  chipRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: radius.pill,
    flexShrink: 0,
  },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catText: { fontWeight: "700", fontSize: typography.sm },
  timeChip: {
    paddingHorizontal: spacing.lg,
    height: 40,
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
  },
  timeChipActive: {
    backgroundColor: colors.surfaceInverse,
    borderColor: colors.surfaceInverse,
  },
  timeText: { fontWeight: "700", color: colors.onSurface },
  timeTextActive: { color: colors.onSurfaceInverse },
  priorityRow: { flexDirection: "row", gap: spacing.sm },
  priorityBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityLabel: {
    fontWeight: "700",
    color: colors.onSurface,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    ...shadows.fab,
  },
  saveBtnDisabled: {
    backgroundColor: colors.borderStrong,
    shadowOpacity: 0,
  },
  saveText: {
    color: colors.onBrandPrimary,
    fontWeight: "800",
    fontSize: typography.lg,
    textTransform: "capitalize",
  },
});
