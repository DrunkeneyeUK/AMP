import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox, View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { AuthProvider, useAuth } from "@/src/auth/AuthContext";
import { colors } from "@/src/constants/theme";

LogBox.ignoreAllLogs(true);

SplashScreen.preventAutoHideAsync();

function RouteGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const first = segments[0];
    const inAuthGroup = first === "(auth)";
    const inAppGroup = first === "(tabs)" || first === "create" || first === "event" || first === "task" || first === "admin";

    if (!user && inAppGroup) {
      router.replace("/(auth)/welcome" as any);
    } else if (user && (inAuthGroup || !first)) {
      router.replace("/(tabs)" as any);
    }
  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="create" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="event/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="task/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="admin/index" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <RouteGuard />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
