import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, type TextInput, View } from 'react-native';

import { AppButton, AppCard, AppInput, AppText, Screen } from '@/components/ui';
import { BRAND } from '@/constants/brand';
import { submitSignIn } from '@/features/auth';
import { BrandMark, EnvironmentBadge } from '@/features/app-shell';
import {
  collectFieldErrors,
  signInSchema,
  type FieldErrors,
  type SignInValues,
} from '@/lib/validation';
import { useTheme } from '@/theme';

export default function SignInScreen() {
  const theme = useTheme();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors<SignInValues>>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    setFormMessage(null);

    const { values, errors: fieldErrors } = collectFieldErrors(signInSchema, { email, password });
    setErrors(fieldErrors);
    if (!values) return;

    setSubmitting(true);
    try {
      const outcome = await submitSignIn(values);
      switch (outcome.status) {
        case 'signed_in':
          return;
        case 'invalid_credentials':
          setFormMessage(
            'That email and password combination was not recognised. Check both and try again.'
          );
          return;
        case 'not_available':
        case 'error':
          setFormMessage(outcome.message);
          return;
      }
    } catch {
      setFormMessage(
        "We couldn't reach the server. Nothing you typed has been sent. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }, [email, password]);

  return (
    <Screen testID="sign-in-screen">
      <View style={[styles.header, { paddingTop: theme.spacing.huge, gap: theme.spacing.lg }]}>
        <EnvironmentBadge />
        <BrandMark showTagline />
      </View>

      <AppCard style={{ marginTop: theme.spacing.xxl }}>
        <View style={{ gap: theme.spacing.lg }}>
          <AppText accessibilityRole="header" variant="titleMedium">
            Sign in
          </AppText>

          <AppInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            inputMode="email"
            keyboardType="email-address"
            returnKeyType="next"
            textContentType="emailAddress"
            placeholder="alex@contractor.co.uk"
            onSubmitEditing={() => passwordRef.current?.focus()}
            testID="sign-in-email"
          />

          <AppInput
            ref={passwordRef}
            label="Password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            autoCapitalize="none"
            autoComplete="current-password"
            secureTextEntry
            returnKeyType="go"
            textContentType="password"
            onSubmitEditing={() => void handleSubmit()}
            testID="sign-in-password"
          />

          {formMessage ? (
            <View
              accessibilityRole="alert"
              style={[
                styles.notice,
                {
                  backgroundColor: theme.colors.statusInfoSurface,
                  borderColor: theme.colors.statusInfo,
                  borderRadius: theme.radius.md,
                  borderWidth: theme.borderWidth.hairline,
                  padding: theme.spacing.md,
                },
              ]}
              testID="sign-in-message"
            >
              <AppText variant="bodySmall" style={{ color: theme.colors.statusInfo }}>
                {formMessage}
              </AppText>
            </View>
          ) : null}

          <AppButton
            label="Sign In"
            loading={submitting}
            onPress={() => void handleSubmit()}
            testID="sign-in-submit"
          />

          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={() =>
              setFormMessage(
                'Password recovery arrives with authentication in the next foundation release. ' +
                  `Until then, contact ${BRAND.supportEmail}.`
              )
            }
            style={[styles.forgot, { minHeight: theme.touchTarget.min }]}
            testID="sign-in-forgot"
          >
            <AppText variant="label" color="accent">
              Forgot password?
            </AppText>
          </Pressable>
        </View>
      </AppCard>

      <AppText
        variant="bodySmall"
        color="muted"
        align="center"
        style={{ marginTop: theme.spacing.xxl }}
      >
        {`Accounts are created by your ${BRAND.company} administrator. There is no public sign-up.`}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  forgot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'flex-start',
  },
  notice: {
    width: '100%',
  },
});
