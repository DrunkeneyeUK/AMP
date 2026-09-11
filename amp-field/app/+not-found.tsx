import { router, Stack } from 'expo-router';

import { ErrorState, Screen } from '@/components/ui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen scrollable={false} testID="not-found-screen">
        <ErrorState
          fill
          title="We couldn't find that screen"
          message="The link you followed points somewhere that doesn't exist in this version of AMP Field. Your work is safe."
          retryLabel="Go to sign in"
          onRetry={() => router.replace('/sign-in')}
        />
      </Screen>
    </>
  );
}
