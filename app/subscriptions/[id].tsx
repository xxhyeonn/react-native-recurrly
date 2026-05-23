import { View, Text } from 'react-native'
import { useLocalSearchParams, Link } from 'expo-router';

/** Detail view for a single subscription identified by route param. */
const SubscriptionDetails = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View>
      <Text>SubscriptionDetails: {id}</Text>
      <Link href="/">Go Back</Link>
    </View>
  )
}

export default SubscriptionDetails