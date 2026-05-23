import { colors } from "@/constants/theme";
import "@/global.css";
import { useSignIn } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { clsx } from "clsx";
import { type Href, Link, useRouter } from "expo-router";
import { styled } from "nativewind";
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput as RNTextInput,
    View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

// NativeWind v5: TextInput (like SafeAreaView) is not pre-wired for className —
// it must be explicitly wrapped with styled() so NativeWind can process its styles.
const SafeAreaView = styled(RNSafeAreaView);
const TextInput = styled(RNTextInput);

// ─── validation ─────────────────────────────────────────────────────────────

const isValidEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

interface LocalErrors {
  email?: string;
  password?: string;
}

// ─── component ──────────────────────────────────────────────────────────────

export default function SignIn() {
  // @clerk/expo v3 — signal-based API: no isLoaded / setActive
  const { signIn, errors: clerkErrors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localErrors, setLocalErrors] = useState<LocalErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const isLoading = fetchStatus === "fetching" || isFinalizing;

  // ── validation ────────────────────────────────────────────────────────────

  function validate(): LocalErrors {
    const errs: LocalErrors = {};
    if (!emailAddress.trim()) {
      errs.email = "Email address is required.";
    } else if (!isValidEmail(emailAddress)) {
      errs.email = "Please enter a valid email address.";
    }
    if (!password) {
      errs.password = "Password is required.";
    }
    return errs;
  }

  // ── submit ────────────────────────────────────────────────────────────────

  async function handleSignIn() {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);
      return;
    }

    setLocalErrors({});
    setGeneralError(null);

    try {
      // v3 API: signIn.password() instead of signIn.create()
      const { error } = await signIn.password({
        emailAddress: emailAddress.trim().toLowerCase(),
        password,
      });

      // Clerk populates clerkErrors.fields automatically — bail on field error.
      if (error) return;

      if (signIn.status === "complete") {
        setIsFinalizing(true);
        await signIn.finalize({
          navigate: ({ session, decorateUrl }) => {
            // Session tasks (MFA setup, etc.) — skip navigation.
            if (session?.currentTask) return;

            const url = decorateUrl("/");
            router.replace(url as Href);
          },
        });
      }
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        "Something went wrong. Please try again.";
      setGeneralError(msg);
    } finally {
      setIsFinalizing(false);
    }
  }

  const isDisabled = isLoading || !emailAddress.trim() || !password;

  // Merge local + Clerk field errors so the freshest message wins.
  // SignInFields uses 'identifier' (not 'emailAddress') for the email/username field.
  const emailError = localErrors.email ?? clerkErrors.fields.identifier?.message;
  const passwordError = localErrors.password ?? clerkErrors.fields.password?.message;

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="auth-scroll"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="auth-content">

            {/* ── Brand block ─────────────────────────────────────────── */}
            <View className="auth-brand-block">
              <View className="auth-logo-wrap">
                <View className="auth-logo-mark">
                  <Text className="auth-logo-mark-text">S</Text>
                </View>
                <View>
                  <Text className="auth-wordmark">SubTrack</Text>
                  <Text className="auth-wordmark-sub">Subscription Manager</Text>
                </View>
              </View>

              <Text className="auth-title">Welcome back</Text>
              <Text className="auth-subtitle">
                Sign in to keep your subscriptions under control
              </Text>
            </View>

            {/* ── Form card ────────────────────────────────────────────── */}
            <View className="auth-card">
              <View className="auth-form">

                {/* General / unexpected error */}
                {generalError ? (
                  <View className="rounded-2xl bg-destructive/10 px-4 py-3">
                    <Text className="text-sm font-sans-medium text-destructive">
                      {generalError}
                    </Text>
                  </View>
                ) : null}

                {/* Email */}
                <View className="auth-field">
                  <Text className="auth-label">Email address</Text>
                  <TextInput
                    className={clsx(
                      "auth-input",
                      emailError && "auth-input-error"
                    )}
                    value={emailAddress}
                    onChangeText={(v) => {
                      setEmailAddress(v);
                      setLocalErrors((e) => ({ ...e, email: undefined }));
                      setGeneralError(null);
                    }}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    returnKeyType="next"
                  />
                  {emailError ? (
                    <Text className="auth-error">{emailError}</Text>
                  ) : null}
                </View>

                {/* Password */}
                <View className="auth-field">
                  <Text className="auth-label">Password</Text>
                  <View className="relative">
                    <TextInput
                      className={clsx(
                        "auth-input",
                        passwordError && "auth-input-error"
                      )}
                      style={{ paddingRight: 52 }}
                      value={password}
                      onChangeText={(v) => {
                        setPassword(v);
                        setLocalErrors((e) => ({ ...e, password: undefined }));
                        setGeneralError(null);
                      }}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.mutedForeground}
                      secureTextEntry={!showPassword}
                      textContentType="password"
                      autoComplete="current-password"
                      returnKeyType="done"
                      onSubmitEditing={handleSignIn}
                    />
                    <Pressable
                      className="absolute right-4 top-0 bottom-0 justify-center"
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={colors.mutedForeground}
                      />
                    </Pressable>
                  </View>
                  {passwordError ? (
                    <Text className="auth-error">{passwordError}</Text>
                  ) : null}
                </View>

                {/* CTA */}
                <Pressable
                  className={clsx(
                    "auth-button",
                    isDisabled && "auth-button-disabled"
                  )}
                  onPress={handleSignIn}
                  disabled={isDisabled}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text className="auth-button-text">Sign in</Text>
                  )}
                </Pressable>

              </View>
            </View>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <View className="auth-link-row">
              <Text className="auth-link-copy">Don't have an account?</Text>
              <Link href={"/(auth)/sign-up" as Href}>
                <Text className="auth-link">Create account</Text>
              </Link>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
