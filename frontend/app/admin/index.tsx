import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { spacing, radius, typography, shadows, CategoryDef } from "@/src/constants/theme";
import { useAuth } from "@/src/auth/AuthContext";
import { api, UserInfo } from "@/src/lib/api";
import { useTheme } from "@/src/theme/ThemeContext";
import { useThemedStyles } from "@/src/theme/useThemedStyles";

const BRAND_COLORS = [
  "#FF6B5C", "#FF3B30", "#FF9500", "#FFCC00",
  "#34C759", "#00C7BE", "#32ADE6", "#5856D6",
  "#AF52DE", "#FF2D55", "#8E8E93", "#1C1B1A",
];

export default function AdminScreen() {
  const router = useRouter();
  const { user, company, refreshCompany } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [companyName, setCompanyName] = useState(company?.name ?? "");
  const [brandColor, setBrandColor] = useState(company?.brand_color ?? "#FF6B5C");
  const [visibility, setVisibility] = useState<"shared" | "private">(
    (company?.visibility_mode as any) ?? "shared"
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(company?.logo_url ?? null);
  const [inviteCode, setInviteCode] = useState<string>(company?.invite_code ?? "");
  const [members, setMembers] = useState<UserInfo[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Categories
  const [categories, setCategories] = useState<CategoryDef[]>(company?.categories ?? []);
  const [editingCat, setEditingCat] = useState<CategoryDef | null>(null);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatColor, setNewCatColor] = useState("#FF6B5C");

  useEffect(() => {
    (async () => {
      try {
        const c = await api.getCompany();
        if (c.invite_code) setInviteCode(c.invite_code);
        setLogoUrl(c.logo_url ?? null);
        setCompanyName(c.name);
        setBrandColor(c.brand_color);
        setVisibility(c.visibility_mode);
      } catch (e) {
        console.warn(e);
      }
      try {
        const users = await api.listUsers();
        setMembers(users);
      } catch (e) {
        console.warn(e);
      }
      try {
        const cats = await api.listCategories();
        setCategories(cats);
      } catch (e) {
        console.warn(e);
      }
    })();
  }, []);

  const pickLogo = async () => {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Photo library permission needed");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      exif: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;

    setUploading(true);
    try {
      let r: { logo_url: string };
      if (Platform.OS === "web") {
        const blob = await (await fetch(asset.uri)).blob();
        r = await api.uploadLogoWeb(blob);
      } else {
        r = await api.uploadLogo(asset.uri, asset.mimeType || "image/png");
      }
      setLogoUrl(r.logo_url);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshCompany();
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.updateCompany({
        name: companyName.trim(),
        brand_color: brandColor,
        visibility_mode: visibility,
      });
      await refreshCompany();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const rotate = async () => {
    setRotating(true);
    try {
      const r = await api.rotateInvite();
      setInviteCode(r.invite_code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.warn(e);
    } finally {
      setRotating(false);
    }
  };

  const copy = async (t: string) => {
    Haptics.selectionAsync();
    await Clipboard.setStringAsync(t);
  };

  // Category CRUD
  const addCategory = async () => {
    if (!newCatLabel.trim()) return;
    try {
      const cat = await api.createCategory({ label: newCatLabel.trim(), color: newCatColor });
      setCategories((prev) => [...prev, cat]);
      setNewCatLabel("");
      setNewCatColor("#FF6B5C");
      setShowNewCat(false);
      await refreshCompany();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e?.message || "Add failed");
    }
  };

  const saveEditingCat = async () => {
    if (!editingCat) return;
    try {
      const updated = await api.updateCategory(editingCat.key, {
        label: editingCat.label,
        color: editingCat.color,
      });
      setCategories((prev) => prev.map((c) => (c.key === updated.key ? updated : c)));
      setEditingCat(null);
      await refreshCompany();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e?.message || "Save failed");
    }
  };

  const deleteCategory = async (key: string) => {
    try {
      await api.deleteCategory(key);
      setCategories((prev) => prev.filter((c) => c.key !== key));
      await refreshCompany();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e?.message || "Delete failed");
    }
  };

  if (user?.role !== "admin") {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={{ padding: spacing.xl }}>Only admins can view this page.</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} testID="admin-back">
            <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.hTitle}>Admin</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <Text style={styles.section}>Branding</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Company logo</Text>
            <View style={styles.logoRow}>
              <View style={[styles.logoPreview, { borderColor: brandColor }]}>
                {logoUrl ? (
                  <Image
                    source={{ uri: logoUrl }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="contain"
                  />
                ) : (
                  <Ionicons name="image-outline" size={32} color={colors.onSurfaceTertiary} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Pressable
                  onPress={pickLogo}
                  style={styles.uploadBtn}
                  disabled={uploading}
                  testID="upload-logo-btn"
                >
                  {uploading ? (
                    <ActivityIndicator color={colors.brandPrimary} />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={16} color={colors.brandPrimary} />
                      <Text style={styles.uploadText}>
                        {logoUrl ? "Change logo" : "Upload logo"}
                      </Text>
                    </>
                  )}
                </Pressable>
                <Text style={styles.hint}>PNG, JPG, or WebP · max 2MB</Text>
              </View>
            </View>
          </View>

          {/* Company name */}
          <View style={styles.card}>
            <Text style={styles.label}>Company name</Text>
            <TextInput
              value={companyName}
              onChangeText={setCompanyName}
              style={styles.input}
              placeholderTextColor={colors.onSurfaceTertiary}
              testID="admin-companyname-input"
            />
          </View>

          {/* Brand color */}
          <View style={styles.card}>
            <Text style={styles.label}>Brand color</Text>
            <View style={styles.colorRow}>
              {BRAND_COLORS.map((c) => {
                const active = c.toLowerCase() === brandColor.toLowerCase();
                return (
                  <Pressable
                    key={c}
                    onPress={() => setBrandColor(c)}
                    style={[styles.colorSwatch, { backgroundColor: c }, active && styles.colorSwatchActive]}
                    testID={`color-${c.replace('#', '')}`}
                  >
                    {active && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Visibility */}
          <View style={styles.card}>
            <Text style={styles.label}>Calendar visibility</Text>
            <View style={styles.visRow}>
              <Pressable
                style={[styles.visCard, visibility === "shared" && styles.visCardActive]}
                onPress={() => setVisibility("shared")}
              >
                <Ionicons
                  name="people"
                  size={18}
                  color={visibility === "shared" ? "#fff" : colors.onSurface}
                />
                <Text style={[styles.visTitle, visibility === "shared" && styles.visTitleActive]}>
                  Shared
                </Text>
              </Pressable>
              <Pressable
                style={[styles.visCard, visibility === "private" && styles.visCardActive]}
                onPress={() => setVisibility("private")}
              >
                <Ionicons
                  name="lock-closed"
                  size={18}
                  color={visibility === "private" ? "#fff" : colors.onSurface}
                />
                <Text style={[styles.visTitle, visibility === "private" && styles.visTitleActive]}>
                  Private
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable style={styles.save} onPress={save} disabled={saving} testID="admin-save">
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={saved ? "checkmark" : "save-outline"} size={18} color="#fff" />
                <Text style={styles.saveText}>{saved ? "Saved!" : "Save changes"}</Text>
              </>
            )}
          </Pressable>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Invite */}
          <Text style={[styles.section, { marginTop: spacing.xl }]}>Invite team</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Your invite code</Text>
            <Pressable onPress={() => copy(inviteCode)} style={styles.inviteBox}>
              <Text style={styles.inviteCode}>{inviteCode}</Text>
              <View style={styles.copyBtn}>
                <Ionicons name="copy-outline" size={16} color={colors.brandPrimary} />
                <Text style={styles.copyText}>Tap to copy</Text>
              </View>
            </Pressable>
            <Pressable onPress={rotate} style={styles.rotateBtn} disabled={rotating} testID="rotate-invite">
              {rotating ? (
                <ActivityIndicator size="small" color={colors.onSurfaceSecondary} />
              ) : (
                <>
                  <Ionicons name="refresh" size={14} color={colors.onSurfaceSecondary} />
                  <Text style={styles.rotateText}>Rotate code (invalidates old code)</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Categories / Event types */}
          <Text style={[styles.section, { marginTop: spacing.xl }]}>Event types</Text>
          <View style={styles.card}>
            {categories.map((cat, i) => {
              const isEditing = editingCat?.key === cat.key;
              return (
                <View
                  key={cat.key}
                  style={[
                    styles.catRow,
                    i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider },
                  ]}
                >
                  {isEditing ? (
                    <>
                      <Pressable
                        onPress={() => {
                          const idx = CAT_COLORS.indexOf(editingCat!.color);
                          const next = CAT_COLORS[(idx + 1) % CAT_COLORS.length];
                          setEditingCat({ ...editingCat!, color: next });
                        }}
                        style={[styles.catSwatch, { backgroundColor: editingCat!.color }]}
                        testID={`cat-edit-color-${cat.key}`}
                      >
                        <Ionicons name="color-palette" size={14} color="#fff" />
                      </Pressable>
                      <TextInput
                        value={editingCat!.label}
                        onChangeText={(t) => setEditingCat({ ...editingCat!, label: t })}
                        style={styles.catInput}
                        autoFocus
                        testID={`cat-edit-label-${cat.key}`}
                      />
                      <Pressable onPress={saveEditingCat} style={styles.catAction} testID={`cat-save-${cat.key}`}>
                        <Ionicons name="checkmark" size={18} color={colors.success} />
                      </Pressable>
                      <Pressable
                        onPress={() => setEditingCat(null)}
                        style={styles.catAction}
                      >
                        <Ionicons name="close" size={18} color={colors.onSurfaceSecondary} />
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <View style={[styles.catSwatch, { backgroundColor: cat.color }]} />
                      <Text style={styles.catLabel} numberOfLines={1}>
                        {cat.label}
                      </Text>
                      <Pressable
                        onPress={() => setEditingCat({ ...cat })}
                        style={styles.catAction}
                        testID={`cat-edit-${cat.key}`}
                      >
                        <Ionicons name="pencil" size={16} color={colors.onSurfaceSecondary} />
                      </Pressable>
                      <Pressable
                        onPress={() => deleteCategory(cat.key)}
                        style={styles.catAction}
                        disabled={categories.length <= 1}
                        testID={`cat-delete-${cat.key}`}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={categories.length <= 1 ? colors.onSurfaceTertiary : colors.error}
                        />
                      </Pressable>
                    </>
                  )}
                </View>
              );
            })}
            {showNewCat ? (
              <View
                style={[
                  styles.catRow,
                  { borderTopWidth: 1, borderTopColor: colors.divider },
                ]}
              >
                <Pressable
                  onPress={() => {
                    const idx = CAT_COLORS.indexOf(newCatColor);
                    const next = CAT_COLORS[(idx + 1) % CAT_COLORS.length];
                    setNewCatColor(next);
                  }}
                  style={[styles.catSwatch, { backgroundColor: newCatColor }]}
                >
                  <Ionicons name="color-palette" size={14} color="#fff" />
                </Pressable>
                <TextInput
                  value={newCatLabel}
                  onChangeText={setNewCatLabel}
                  placeholder="e.g. Client Work"
                  placeholderTextColor={colors.onSurfaceTertiary}
                  style={styles.catInput}
                  autoFocus
                  testID="cat-new-label"
                />
                <Pressable onPress={addCategory} style={styles.catAction} testID="cat-new-save">
                  <Ionicons name="checkmark" size={18} color={colors.success} />
                </Pressable>
                <Pressable onPress={() => setShowNewCat(false)} style={styles.catAction}>
                  <Ionicons name="close" size={18} color={colors.onSurfaceSecondary} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setShowNewCat(true)}
                style={[
                  styles.catRow,
                  {
                    borderTopWidth: 1,
                    borderTopColor: colors.divider,
                    justifyContent: "center",
                    gap: 6,
                  },
                ]}
                testID="cat-new"
              >
                <Ionicons name="add" size={16} color={colors.brandPrimary} />
                <Text style={{ color: colors.brandPrimary, fontWeight: "700" }}>
                  Add event type
                </Text>
              </Pressable>
            )}
          </View>

          {/* Members */}
          <Text style={[styles.section, { marginTop: spacing.xl }]}>
            Team members ({members.length})
          </Text>
          <View style={styles.card}>
            {members.map((m, i) => (
              <View
                key={m.id}
                style={[styles.member, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}
              >
                <View style={[styles.memberAvatar, { backgroundColor: m.color || colors.brandPrimary }]}>
                  <Text style={styles.memberInitial}>
                    {(m.name || m.email).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.memberEmail}>{m.email}</Text>
                </View>
                <View style={[styles.roleTag, m.role === "admin" && { backgroundColor: colors.brandSecondary }]}>
                  <Text style={[styles.roleText, m.role === "admin" && { color: colors.onBrandSecondary }]}>
                    {m.role}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const CAT_COLORS = [
  "#FF6B5C", "#FF3B30", "#FF9500", "#FFCC00", "#34C759",
  "#00C7BE", "#32ADE6", "#5856D6", "#AF52DE", "#FF2D55",
  "#1C1B1A", "#8E8E93",
];

const makeStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  hTitle: { fontSize: typography.xl, fontWeight: "800", color: colors.onSurface },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  section: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.onSurfaceSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.onSurfaceSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  logoPreview: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: "dashed",
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary,
    marginBottom: 6,
  },
  uploadText: { color: colors.brandPrimary, fontWeight: "700", fontSize: typography.sm },
  hint: { fontSize: 11, color: colors.onSurfaceTertiary },
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
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSwatchActive: { borderColor: colors.onSurface },
  visRow: { flexDirection: "row", gap: spacing.sm },
  visCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  visCardActive: { backgroundColor: colors.surfaceInverse, borderColor: colors.surfaceInverse },
  visTitle: { fontWeight: "800", color: colors.onSurface },
  visTitleActive: { color: "#fff" },
  save: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    ...shadows.fab,
  },
  saveText: { color: "#fff", fontWeight: "800", fontSize: typography.base },
  errorBox: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    backgroundColor: colors.errorBg,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  errorText: { color: colors.error, fontWeight: "600", flex: 1 },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  catSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: { flex: 1, fontSize: typography.base, fontWeight: "600", color: colors.onSurface },
  catInput: {
    flex: 1,
    fontSize: typography.base,
    fontWeight: "600",
    color: colors.onSurface,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  catAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteBox: {
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.brandSecondary,
    borderStyle: "dashed",
  },
  inviteCode: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 4,
    color: colors.onBrandTertiary,
    marginBottom: 6,
  },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  copyText: { color: colors.brandPrimary, fontWeight: "700", fontSize: typography.sm },
  rotateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: spacing.sm,
    paddingVertical: 8,
  },
  rotateText: { color: colors.onSurfaceSecondary, fontSize: typography.sm, fontWeight: "600" },
  member: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  memberInitial: { color: "#fff", fontWeight: "800", fontSize: typography.lg },
  memberName: { fontSize: typography.lg, fontWeight: "700", color: colors.onSurface },
  memberEmail: { fontSize: typography.sm, color: colors.onSurfaceSecondary },
  roleTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
  },
  roleText: { fontSize: 10, fontWeight: "800", color: colors.onSurfaceSecondary, letterSpacing: 0.5, textTransform: "uppercase" },
});
