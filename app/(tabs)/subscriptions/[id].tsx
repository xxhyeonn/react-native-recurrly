import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router';
import { Link } from 'expo-router';

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