import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { colors, spacing, radius, typography, shadows } from "@/src/constants/theme";

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <Image
        source={{
          uri: "https://images.pexels.com/photos/5793947/pexels-photo-5793947.jpeg?auto=compress&cs=tinysrgb&w=1200",
        }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={["rgba(28,27,26,0.3)", "rgba(28,27,26,0.95)"]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.top}>
          <View style={styles.logoWrap}>
            <Ionicons name="calendar" size={28} color={colors.brandPrimary} />
          </View>
          <Text style={styles.brand}>DaySync</Text>
          <Text style={styles.sub}>Your team's shared workday</Text>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.title}>Plan work together.</Text>
          <Text style={styles.body}>
            One calendar for your whole company — events, tasks, and everyone's schedule in one place.
          </Text>

          <Pressable
            style={styles.primary}
            onPress={() => router.push("/(auth)/register-admin" as any)}
            testID="welcome-create-company"
          >
            <Text style={styles.primaryText}>Create a company</Text>
          </Pressable>

          <Pressable
            style={styles.secondary}
            onPress={() => router.push("/(auth)/join" as any)}
            testID="welcome-join"
          >
            <Ionicons name="key-outline" size={16} color="#fff" />
            <Text style={styles.secondaryText}>I have an invite code</Text>
          </Pressable>

          <Pressable
            style={styles.tertiary}
            onPress={() => router.push("/(auth)/login" as any)}
            testID="welcome-login"
          >
            <Text style={styles.tertiaryText}>Already have an account? Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceInverse },
  safe: { flex: 1, justifyContent: "space-between", padding: spacing.xl },
  top: { paddingTop: spacing.xl },
  logoWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadows.card,
  },
  brand: { color: "#fff", fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  sub: { color: "rgba(255,255,255,0.75)", fontSize: typography.base, marginTop: 4 },
  bottom: {},
  title: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 42,
    marginBottom: spacing.md,
  },
  body: {
    color: "rgba(255,255,255,0.8)",
    fontSize: typography.lg,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  primary: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadows.fab,
  },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: typography.lg },
  secondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    marginBottom: spacing.md,
  },
  secondaryText: { color: "#fff", fontWeight: "700", fontSize: typography.base },
  tertiary: { alignItems: "center", paddingVertical: spacing.md },
  tertiaryText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: typography.base,
    fontWeight: "600",
  },
});
