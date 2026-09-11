import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

export default function AuthLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.surfacePrimary },
      }}
    >
      <Stack.Screen name="sign-in" />
    </Stack>
  );
}
