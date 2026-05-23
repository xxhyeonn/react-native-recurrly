import "@/global.css";
import { colors } from "@/constants/theme";
import { useSignUp } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { clsx } from "clsx";
import { type Href, Link, useRouter } from "expo-router";
import { styled } from "nativewind";
import React, { useRef, useState } from "react";
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
import { usePostHog } from "posthog-react-native";

// NativeWind v5: TextInput (like SafeAreaView) is not pre-wired for className —
// it must be explicitly wrapped with styled() so NativeWind can process its styles.
const SafeAreaView = styled(RNSafeAreaView);
const TextInput = styled(RNTextInput);

// ─── validation ─────────────────────────────────────────────────────────────

/** Returns true when the value matches a basic email address pattern. */
const isValidEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

interface RegisterErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// ─── component ──────────────────────────────────────────────────────────────

type Step = "register" | "verify";

/** Sign-up screen with email verification flow powered by Clerk. */
export default function SignUp() {
  // @clerk/expo v3 — signal-based API: no isLoaded / setActive
  const { signUp, errors: clerkErrors, fetchStatus } = useSignUp();
  const router = useRouter();
  const posthog = usePostHog();

  // ── step ─────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("register");

  // ── register ─────────────────────────────────────────────────────────────
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({});
  const [registerGeneralError, setRegisterGeneralError] = useState<
    string | null
  >(null);

  // ── verify ────────────────────────────────────────────────────────────────
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifyGeneralError, setVerifyGeneralError] = useState<string | null>(
    null
  );
  const [resendCooldown, setResendCooldown] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // ── refs ──────────────────────────────────────────────────────────────────
  const passwordRef = useRef<RNTextInput>(null);
  const confirmRef = useRef<RNTextInput>(null);

  const isLoading = fetchStatus === "fetching" || isFinalizing;

  // ── register validation ───────────────────────────────────────────────────

  /** Validates registration fields before creating a Clerk account. */
  function validateRegister(): RegisterErrors {
    const errs: RegisterErrors = {};
    if (!emailAddress.trim()) {
      errs.email = "Email address is required.";
    } else if (!isValidEmail(emailAddress)) {
      errs.email = "Please enter a valid email address.";
    }
    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }
    if (!confirmPassword) {
      errs.confirmPassword = "Please confirm your password.";
    } else if (confirmPassword !== password) {
      errs.confirmPassword = "Passwords don't match.";
    }
    return errs;
  }

  /** Updates the email field and clears related validation errors. */
  function handleEmailChange(v: string) {
    setEmailAddress(v);
    setRegisterErrors((e) => ({ ...e, email: undefined }));
    setRegisterGeneralError(null);
  }

  /** Updates the password field and clears related validation errors. */
  function handlePasswordChange(v: string) {
    setPassword(v);
    setRegisterErrors((e) => ({ ...e, password: undefined }));
  }

  /** Updates the confirm-password field and clears related validation errors. */
  function handleConfirmPasswordChange(v: string) {
    setConfirmPassword(v);
    setRegisterErrors((e) => ({ ...e, confirmPassword: undefined }));
  }

  /** Sanitizes and stores the six-digit verification code. */
  function handleCodeChange(v: string) {
    const clean = v.replace(/\D/g, "").slice(0, 6);
    setCode(clean);
    setCodeError(null);
    setVerifyGeneralError(null);
  }

  /** Navigates home after sign-up unless Clerk has pending session tasks. */
  function navigateAfterSignUp({
    session,
    decorateUrl,
  }: {
    session?: { currentTask?: unknown };
    decorateUrl: (url: string) => string;
  }) {
    if (session?.currentTask) return;
    router.replace(decorateUrl("/") as Href);
  }

  // ── handlers ──────────────────────────────────────────────────────────────

  /** Creates a Clerk account and sends a verification code. */
  async function handleRegister() {
    const errs = validateRegister();
    if (Object.keys(errs).length > 0) {
      setRegisterErrors(errs);
      return;
    }

    setRegisterErrors({});
    setRegisterGeneralError(null);

    try {
      // v3 API: signUp.password() → send verification code
      const { error } = await signUp.password({
        emailAddress: emailAddress.trim().toLowerCase(),
        password,
      });

      // Clerk populates clerkErrors.fields automatically.
      if (error) return;

      await signUp.verifications.sendEmailCode();
      posthog.capture("user_registered");
      setStep("verify");
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        "Something went wrong. Please try again.";
      setRegisterGeneralError(msg);
    }
  }

  /** Verifies the code and finalizes the new session. */
  async function handleVerify() {
    if (!code.trim()) {
      setCodeError("Please enter the verification code.");
      return;
    }
    if (code.trim().length !== 6) {
      setCodeError("The code is 6 digits — double-check your inbox.");
      return;
    }

    setCodeError(null);
    setVerifyGeneralError(null);

    try {
      // v3 API: signUp.verifications.verifyEmailCode()
      await signUp.verifications.verifyEmailCode({ code: code.trim() });

      if (signUp.status === "complete") {
        const distinctId = emailAddress.trim().toLowerCase();
        posthog.identify(distinctId, {
          $set_once: { sign_up_date: new Date().toISOString() },
        });
        posthog.capture("user_signup_completed");

        setIsFinalizing(true);
        await signUp.finalize({
          navigate: navigateAfterSignUp,
        });
      } else {
        setVerifyGeneralError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      const errCode = err?.errors?.[0]?.code ?? "";
      if (
        errCode === "verification_failed" ||
        errCode === "form_code_incorrect"
      ) {
        setCodeError("That code is incorrect. Please try again.");
      } else if (errCode === "verification_expired") {
        setCodeError("The code has expired. Request a new one below.");
      } else {
        setVerifyGeneralError(
          err?.errors?.[0]?.longMessage ??
            err?.errors?.[0]?.message ??
            "Something went wrong. Please try again."
        );
      }
    } finally {
      setIsFinalizing(false);
    }
  }

  /** Resends the verification code with a cooldown guard. */
  async function handleResend() {
    if (resendCooldown) return;

    setResendCooldown(true);
    setVerifyGeneralError(null);
    setCodeError(null);

    try {
      await signUp.verifications.sendEmailCode();
      posthog.capture("verification_code_resent");
    } catch {
      // Silent — user will retry if needed.
    }

    // 30-second cooldown to prevent spam.
    setTimeout(() => setResendCooldown(false), 30_000);
  }

  /** Returns the user to the registration step to change their address. */
  function handleBackToRegister() {
    setStep("register");
    setCode("");
    setCodeError(null);
    setVerifyGeneralError(null);
  }

  // ── derived ───────────────────────────────────────────────────────────────

  const isRegisterDisabled =
    isLoading || !emailAddress.trim() || !password || !confirmPassword;
  const isVerifyDisabled = isLoading || code.trim().length === 0;

  // Merge local + Clerk field errors (local takes priority until cleared).
  const emailError =
    registerErrors.email ?? clerkErrors.fields.emailAddress?.message;
  const passwordError =
    registerErrors.password ?? clerkErrors.fields.password?.message;
  const confirmError = registerErrors.confirmPassword;
  const codeFieldError = codeError ?? clerkErrors.fields.code?.message;

  // ─── render ────────────────────────────────────────────────────────────────

  // ── Shared brand logo block ────────────────────────────────────────────────
  const logoBlock = (
    <View className="auth-logo-wrap">
      <View className="auth-logo-mark">
        <Text className="auth-logo-mark-text">S</Text>
      </View>
      <View>
        <Text className="auth-wordmark">SubTrack</Text>
        <Text className="auth-wordmark-sub">Subscription Manager</Text>
      </View>
    </View>
  );

  // ── Step 1: Register ──────────────────────────────────────────────────────
  if (step === "register") {
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

              {/* ── Brand block ─────────────────────────────────────── */}
              <View className="auth-brand-block">
                {logoBlock}
                <Text className="auth-title">Create your account</Text>
                <Text className="auth-subtitle">
                  Track every subscription in one place, for free
                </Text>
              </View>

              {/* ── Form card ────────────────────────────────────────── */}
              <View className="auth-card">
                <View className="auth-form">

                  {/* General error */}
                  {registerGeneralError ? (
                    <View className="rounded-2xl bg-destructive/10 px-4 py-3">
                      <Text className="text-sm font-sans-medium text-destructive">
                        {registerGeneralError}
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
                      onChangeText={handleEmailChange}
                      placeholder="you@example.com"
                      placeholderTextColor={colors.mutedForeground}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      textContentType="emailAddress"
                      autoComplete="email"
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
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
                        ref={passwordRef}
                        className={clsx(
                          "auth-input",
                          passwordError && "auth-input-error"
                        )}
                        style={{ paddingRight: 52 }}
                        value={password}
                        onChangeText={handlePasswordChange}
                        placeholder="At least 8 characters"
                        placeholderTextColor={colors.mutedForeground}
                        secureTextEntry={!showPassword}
                        textContentType="newPassword"
                        autoComplete="new-password"
                        returnKeyType="next"
                        onSubmitEditing={() => confirmRef.current?.focus()}
                      />
                      <Pressable
                        className="absolute right-4 top-0 bottom-0 justify-center"
                        onPress={() => setShowPassword((v) => !v)}
                        hitSlop={8}
                      >
                        <Ionicons
                          name={
                            showPassword ? "eye-off-outline" : "eye-outline"
                          }
                          size={20}
                          color={colors.mutedForeground}
                        />
                      </Pressable>
                    </View>
                    {passwordError ? (
                      <Text className="auth-error">{passwordError}</Text>
                    ) : null}
                  </View>

                  {/* Confirm password */}
                  <View className="auth-field">
                    <Text className="auth-label">Confirm password</Text>
                    <View className="relative">
                      <TextInput
                        ref={confirmRef}
                        className={clsx(
                          "auth-input",
                          confirmError && "auth-input-error"
                        )}
                        style={{ paddingRight: 52 }}
                        value={confirmPassword}
                        onChangeText={handleConfirmPasswordChange}
                        placeholder="Repeat your password"
                        placeholderTextColor={colors.mutedForeground}
                        secureTextEntry={!showConfirmPassword}
                        textContentType="newPassword"
                        autoComplete="new-password"
                        returnKeyType="done"
                        onSubmitEditing={handleRegister}
                      />
                      <Pressable
                        className="absolute right-4 top-0 bottom-0 justify-center"
                        onPress={() => setShowConfirmPassword((v) => !v)}
                        hitSlop={8}
                      >
                        <Ionicons
                          name={
                            showConfirmPassword
                              ? "eye-off-outline"
                              : "eye-outline"
                          }
                          size={20}
                          color={colors.mutedForeground}
                        />
                      </Pressable>
                    </View>
                    {confirmError ? (
                      <Text className="auth-error">{confirmError}</Text>
                    ) : null}
                  </View>

                  {/* CTA */}
                  <Pressable
                    className={clsx(
                      "auth-button",
                      isRegisterDisabled && "auth-button-disabled"
                    )}
                    onPress={handleRegister}
                    disabled={isRegisterDisabled}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text className="auth-button-text">Create account</Text>
                    )}
                  </Pressable>

                </View>
              </View>

              {/* ── Footer ──────────────────────────────────────────── */}
              <View className="auth-link-row">
                <Text className="auth-link-copy">Already have an account?</Text>
                <Link href={"/(auth)/sign-in" as Href}>
                  <Text className="auth-link">Sign in</Text>
                </Link>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Step 2: Verify ────────────────────────────────────────────────────────
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

            {/* ── Brand block ───────────────────────────────────────── */}
            <View className="auth-brand-block">
              {logoBlock}
              <Text className="auth-title">Check your email</Text>
              <Text className="auth-subtitle">
                We sent a 6-digit code to{"\n"}
                <Text className="font-sans-bold text-primary">
                  {emailAddress}
                </Text>
              </Text>
            </View>

            {/* ── Verify card ──────────────────────────────────────── */}
            <View className="auth-card">
              <View className="auth-form">

                {/* General error */}
                {verifyGeneralError ? (
                  <View className="rounded-2xl bg-destructive/10 px-4 py-3">
                    <Text className="text-sm font-sans-medium text-destructive">
                      {verifyGeneralError}
                    </Text>
                  </View>
                ) : null}

                {/* Code input */}
                <View className="auth-field">
                  <Text className="auth-label">Verification code</Text>
                  <TextInput
                    className={clsx(
                      "auth-input text-center text-2xl tracking-[16px]",
                      codeFieldError && "auth-input-error"
                    )}
                    value={code}
                    onChangeText={handleCodeChange}
                    placeholder="······"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    maxLength={6}
                    textContentType="oneTimeCode"
                    autoComplete="one-time-code"
                    returnKeyType="done"
                    onSubmitEditing={handleVerify}
                  />
                  {codeFieldError ? (
                    <Text className="auth-error">{codeFieldError}</Text>
                  ) : (
                    <Text className="auth-helper">
                      {"Didn't see it? Check your spam folder."}
                    </Text>
                  )}
                </View>

                {/* Primary CTA */}
                <Pressable
                  className={clsx(
                    "auth-button",
                    isVerifyDisabled && "auth-button-disabled"
                  )}
                  onPress={handleVerify}
                  disabled={isVerifyDisabled}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text className="auth-button-text">Verify email</Text>
                  )}
                </Pressable>

                {/* Resend */}
                <Pressable
                  className={clsx(
                    "auth-secondary-button",
                    resendCooldown && "opacity-50"
                  )}
                  onPress={handleResend}
                  disabled={resendCooldown}
                >
                  <Text className="auth-secondary-button-text">
                    {resendCooldown
                      ? "Code sent — check your inbox"
                      : "Resend code"}
                  </Text>
                </Pressable>

              </View>
            </View>

            {/* ── Footer ──────────────────────────────────────────── */}
            <View className="auth-link-row">
              <Text className="auth-link-copy">Wrong email?</Text>
              <Pressable onPress={handleBackToRegister}>
                <Text className="auth-link">Go back</Text>
              </Pressable>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
