import { useEffect } from 'react';
import { View, Text } from 'react-native'
import { useLocalSearchParams, Link } from 'expo-router';
import { usePostHog } from 'posthog-react-native';

/** Detail view for a single subscription identified by route param. */
const SubscriptionDetails = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const posthog = usePostHog();

    useEffect(() => {
        posthog.capture("subscription_details_viewed", { subscription_id: id });
    }, [id, posthog]);

  return (
    <View>
      <Text>SubscriptionDetails: {id}</Text>
      <Link href="/">Go Back</Link>
    </View>
  )
}

export default SubscriptionDetails
