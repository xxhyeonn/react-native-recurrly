import "@/global.css";
import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";

export default function AuthRoutesLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  // Wait for Clerk to resolve session state before making any routing decision.
  if (!isLoaded) return null;

  // Signed-in users have no business on auth screens — bounce them home.
  if (isSignedIn) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
