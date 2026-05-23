import { useAuth } from "@clerk/expo";
import { Text, TouchableOpacity } from 'react-native';
import { styled } from "react-native-css";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

/** Settings screen with Clerk-powered sign-out. */
const Settings = () => {
  const { signOut } = useAuth();

  /** Signs the current user out and returns them to the auth flow. */
  const handleSignOut = () => {
    signOut();
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text>Settings</Text>
      <TouchableOpacity
        onPress={handleSignOut}
        className="mt-6 bg-red-500 rounded-xl p-4 items-center"
      >
        <Text className="text-white font-semibold text-base">Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

export default Settings