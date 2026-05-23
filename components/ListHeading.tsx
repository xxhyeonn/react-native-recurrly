import { Text, TouchableOpacity, View } from 'react-native';

/** Section heading with an optional "View All" action. */
const ListHeading = ({ title, onPressViewAll }: ListHeadingProps) => {
  return (
    <View className="list-head">
      <Text className="list-title">{title}</Text>

      <TouchableOpacity className="list-action" onPress={onPressViewAll}>
        <Text className="list-action-text">View All</Text>
      </TouchableOpacity>
    </View>
  )
}

export default ListHeading