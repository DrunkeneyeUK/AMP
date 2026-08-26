import { useState } from "react";
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { spacing, radius, typography, shadows } from "@/src/constants/theme";
import { useAuth } from "@/src/auth/AuthContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { useThemedStyles } from "@/src/theme/useThemedStyles";

type Visibility = "shared" | "private";

export default function RegisterAdminScreen() {
  const router = useRouter();
  const { signUpAdmin, refresh } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [step, setStep] = useState<"form" | "invite">("form");
  const [companyName, setCompanyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("shared");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");

  const canSubmit =
    companyName.trim().length > 0 &&
    adminName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const r = await signUpAdmin({
        company_name: companyName.trim(),
        admin_name: adminName.trim(),
        admin_email: email.trim().toLowerCase(),
        admin_password: password,
        visibility_mode: visibility,
      });
      setInviteCode(r.invite_code);
      setStep("invite");
    } catch (e: any) {
      setError(e?.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const copyInvite = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(inviteCode);
  };

  const enterApp = async () => {
    await refresh();
    // RouteGuard will send to /(tabs)
  };

  if (step === "invite") {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.hTitle}>You're all set</Text>
        </View>
        <View style={styles.inviteWrap}>
          <View style={styles.checkIcon}>
            <Ionicons name="checkmark" size={40} color="#fff" />
          </View>
          <Text style={styles.inviteTitle}>Company created</Text>
          <Text style={styles.inviteSub}>
            Share this invite code with your team. They'll enter it when they sign up.
          </Text>
          <Pressable style={styles.inviteBox} onPress={copyInvite}>
            <Text style={styles.inviteCode}>{inviteCode}</Text>
            <View style={styles.copyBtn}>
              <Ionicons name="copy-outline" size={18} color={colors.brandPrimary} />
              <Text style={styles.copyText}>Tap to copy</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.primary}
            onPress={enterApp}
            testID="admin-continue"
          >
            <Text style={styles.primaryText}>Continue to DaySync</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logo}>
            <Ionicons name="business" size={26} color={colors.brandPrimary} />
          </View>
          <Text style={styles.title}>Create a company</Text>
          <Text style={styles.sub}>
            You'll be the admin — set the branding and invite your team next.
          </Text>

          <Field label="Company name">
            <TextInput
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="Acme Inc."
              placeholderTextColor={colors.onSurfaceTertiary}
              style={styles.input}
              testID="admin-company-name"
            />
          </Field>

          <Field label="Your name">
            <TextInput
              value={adminName}
              onChangeText={setAdminName}
              placeholder="Alex Rivera"
              placeholderTextColor={colors.onSurfaceTertiary}
              style={styles.input}
              testID="admin-name"
            />
          </Field>

          <Field label="Work email">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="alex@acme.com"
              placeholderTextColor={colors.onSurfaceTertiary}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              testID="admin-email"
            />
          </Field>

          <Field label="Password (min 6 characters)">
            <View style={styles.inputRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor={colors.onSurfaceTertiary}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                style={[styles.input, { flex: 1 }]}
                testID="admin-password"
              />
              <Pressable
                onPress={() => setShowPw((v) => !v)}
                style={styles.showBtn}
              >
                <Ionicons
                  name={showPw ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={colors.onSurfaceSecondary}
                />
              </Pressable>
            </View>
          </Field>

          <Field label="Calendar visibility">
            <View style={styles.visRow}>
              <Pressable
                style={[styles.visCard, visibility === "shared" && styles.visCardActive]}
                onPress={() => setVisibility("shared")}
                testID="visibility-shared"
              >
                <Ionicons
                  name="people"
                  size={20}
                  color={visibility === "shared" ? "#fff" : colors.onSurface}
                />
                <Text style={[styles.visTitle, visibility === "shared" && styles.visTitleActive]}>
                  Shared team
                </Text>
                <Text style={[styles.visSub, visibility === "shared" && styles.visSubActive]}>
                  Everyone sees each other's events & tasks
                </Text>
              </Pressable>
              <Pressable
                style={[styles.visCard, visibility === "private" && styles.visCardActive]}
                onPress={() => setVisibility("private")}
                testID="visibility-private"
              >
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={visibility === "private" ? "#fff" : colors.onSurface}
                />
                <Text style={[styles.visTitle, visibility === "private" && styles.visTitleActive]}>
                  Private
                </Text>
                <Text style={[styles.visSub, visibility === "private" && styles.visSubActive]}>
                  Each employee sees only their own
                </Text>
              </Pressable>
            </View>
          </Field>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[styles.primary, (!canSubmit || loading) && styles.primaryDisabled]}
            onPress={submit}
            disabled={!canSubmit || loading}
            testID="admin-submit"
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Create company</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  hTitle: { fontSize: typography.xl, fontWeight: "800", color: colors.onSurface },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: typography.base,
    color: colors.onSurfaceSecondary,
    marginTop: 6,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  field: { marginBottom: spacing.md },
  label: {
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
  inputRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  showBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  visRow: { flexDirection: "row", gap: spacing.sm },
  visCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  visCardActive: { backgroundColor: colors.surfaceInverse, borderColor: colors.surfaceInverse },
  visTitle: { fontWeight: "800", color: colors.onSurface, fontSize: typography.base },
  visTitleActive: { color: "#fff" },
  visSub: { fontSize: 11, color: colors.onSurfaceSecondary, lineHeight: 14 },
  visSubActive: { color: "rgba(255,255,255,0.7)" },
  errorBox: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    backgroundColor: colors.errorBg,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.error, fontWeight: "600", flex: 1 },
  primary: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    ...shadows.fab,
  },
  primaryDisabled: { backgroundColor: colors.borderStrong, shadowOpacity: 0 },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: typography.lg },

  // invite screen
  inviteWrap: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  checkIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  inviteTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  inviteSub: {
    fontSize: typography.base,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  inviteBox: {
    width: "100%",
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.brandSecondary,
    borderStyle: "dashed",
  },
  inviteCode: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 4,
    color: colors.onBrandTertiary,
    marginBottom: spacing.sm,
  },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  copyText: {
    color: colors.brandPrimary,
    fontWeight: "700",
    fontSize: typography.sm,
  },
});
