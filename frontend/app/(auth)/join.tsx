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

import { spacing, radius, typography, shadows } from "@/src/constants/theme";
import { useAuth } from "@/src/auth/AuthContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { useThemedStyles } from "@/src/theme/useThemedStyles";

export default function JoinScreen() {
  const router = useRouter();
  const { signUpEmployee } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [inviteCode, setInviteCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    inviteCode.trim().length >= 4 &&
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await signUpEmployee({
        invite_code: inviteCode.trim().toUpperCase(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
    } catch (e: any) {
      setError(e?.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

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
            <Ionicons name="key" size={24} color={colors.brandPrimary} />
          </View>
          <Text style={styles.title}>Join your team</Text>
          <Text style={styles.sub}>
            Enter the invite code your admin shared with you.
          </Text>

          <Field label="Invite code">
            <TextInput
              value={inviteCode}
              onChangeText={(t) => setInviteCode(t.toUpperCase())}
              placeholder="ABCD1234"
              placeholderTextColor={colors.onSurfaceTertiary}
              autoCapitalize="characters"
              style={[styles.input, styles.codeInput]}
              testID="join-code"
            />
          </Field>

          <Field label="Your name">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Sam Lee"
              placeholderTextColor={colors.onSurfaceTertiary}
              style={styles.input}
              testID="join-name"
            />
          </Field>

          <Field label="Work email">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="sam@acme.com"
              placeholderTextColor={colors.onSurfaceTertiary}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              testID="join-email"
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
                testID="join-password"
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
            testID="join-submit"
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Join company</Text>}
          </Pressable>

          <Pressable onPress={() => router.push("/(auth)/login" as any)} style={styles.link}>
            <Text style={styles.linkText}>Already have an account? Sign in</Text>
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
  title: { fontSize: 30, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5 },
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
  codeInput: {
    letterSpacing: 4,
    fontWeight: "800",
    fontSize: typography.xl,
    textAlign: "center",
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
  link: { alignItems: "center", paddingVertical: spacing.md },
  linkText: { color: colors.brandPrimary, fontWeight: "600", fontSize: typography.base },
});
