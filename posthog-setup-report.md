<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the SubTrack Expo app. The integration adds event tracking, user identification, screen tracking, and error-aware capture across all key user flows — authentication, subscription interaction, and onboarding.

## Summary of changes

| File | Change |
|------|--------|
| `app.config.js` | Created — replaces `app.json` to expose `posthogProjectToken` and `posthogHost` via `expo-constants` extras |
| `.env` | Created — stores `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` (git-ignored) |
| `src/config/posthog.ts` | Created — PostHog client singleton configured from `Constants.expoConfig.extra` |
| `app/_layout.tsx` | Updated — wraps app in `PostHogProvider`; adds manual screen tracking via `posthog.screen()` on pathname changes |
| `app/(auth)/sign-in.tsx` | Updated — captures `user_signed_in`, `user_sign_in_failed`; calls `posthog.identify()` on success |
| `app/(auth)/sign-up.tsx` | Updated — captures `user_registered`, `user_signup_completed`, `verification_code_resent`; calls `posthog.identify()` on verification complete |
| `app/(tabs)/index.tsx` | Updated — captures `subscription_card_expanded` and `subscription_card_collapsed` with subscription ID and name |
| `app/(tabs)/settings.tsx` | Updated — captures `user_signed_out` and calls `posthog.reset()` before sign-out |
| `app/subscriptions/[id].tsx` | Updated — captures `subscription_details_viewed` with subscription ID on mount |
| `app/onboarding.tsx` | Updated — captures `onboarding_viewed` on mount |

## Events instrumented

| Event | Description | File |
|-------|-------------|------|
| `user_signed_in` | Fired when a user successfully completes sign-in | `app/(auth)/sign-in.tsx` |
| `user_sign_in_failed` | Fired when a sign-in attempt fails with an error | `app/(auth)/sign-in.tsx` |
| `user_registered` | Fired when a user completes registration and a verification code is sent | `app/(auth)/sign-up.tsx` |
| `user_signup_completed` | Fired when a user successfully verifies their code and completes sign-up | `app/(auth)/sign-up.tsx` |
| `verification_code_resent` | Fired when a user requests a new verification code during sign-up | `app/(auth)/sign-up.tsx` |
| `user_signed_out` | Fired when a user taps the sign-out button in settings | `app/(tabs)/settings.tsx` |
| `subscription_card_expanded` | Fired when a user expands a subscription card to view details | `app/(tabs)/index.tsx` |
| `subscription_card_collapsed` | Fired when a user collapses an expanded subscription card | `app/(tabs)/index.tsx` |
| `subscription_details_viewed` | Fired when a user navigates to the subscription detail screen | `app/subscriptions/[id].tsx` |
| `onboarding_viewed` | Fired when the onboarding screen is displayed to a new user | `app/onboarding.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1621318)
- [Sign-ups over time](/insights/q82Pbgu1) — daily new registrations trend
- [Sign-ins over time](/insights/jroS7dX5) — daily active sign-ins trend
- [Sign-up conversion funnel](/insights/65RANEGv) — registration → email verified drop-off
- [Subscription card engagement](/insights/yfgUgyce) — expand vs. collapse interactions
- [Sign-in failure rate](/insights/SXk0aEKW) — failures vs. successes to spot auth friction

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-expo/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
