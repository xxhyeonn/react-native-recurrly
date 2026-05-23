import ListHeading from "@/components/ListHeading";
import SubscriptionCard from "@/components/SubscriptionCard";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import { HOME_BALANCE, HOME_SUBSCRIPTIONS, UPCOMING_SUBSCRIPTIONS } from "@/constants/data";
import { icons } from "@/constants/icons";
import images from "@/constants/images";
import "@/global.css";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@clerk/expo";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { useState } from "react";
import { FlatList, Image, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
const SafeAreaView = styled(RNSafeAreaView);

/** Home screen displaying the signed-in user's profile and subscription lists. */
export default function App() {
    const { user } = useUser();
    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);

    // Get user display name: firstName, fullName, or email
    const displayName = user?.firstName || user?.fullName || user?.emailAddresses[0]?.emailAddress || 'User';

    /** Toggles expanded state for a subscription card in the main list. */
    const handleSubscriptionPress = (id: string) => {
        setExpandedSubscriptionId((currentId) => currentId === id ? null : id);
    };

    /** Renders a single upcoming renewal card. */
    const renderUpcomingItem = ({ item }: { item: UpcomingSubscription }) => (
        <UpcomingSubscriptionCard {...item} />
    );

    /** Returns the stable key for an upcoming subscription row. */
    const keyUpcomingById = (item: UpcomingSubscription) => item.id;

    /** Renders the home list header with profile, balance, and upcoming renewals. */
    const renderListHeader = () => (
        <>
            <View className="home-header">
                <View className="home-user">
                    <Image
                        source={user?.imageUrl ? { uri: user.imageUrl } : images.avatar}
                        className="home-avatar"
                    />
                    <Text className="home-user-name">{displayName}</Text>
                </View>

                <Image source={icons.add} className="home-add-icon" />
            </View>

            <View className="home-balance-card">
                <Text className="home-balance-label">Balance</Text>

                <View className="home-balance-row">
                    <Text className="home-balance-amount">
                        {formatCurrency(HOME_BALANCE.amount)}
                    </Text>
                    <Text className="home-balance-date">
                        {dayjs(HOME_BALANCE.nextRenewalDate).format('MM/DD')}
                    </Text>
                </View>
            </View>

            <View className="mb-5">
                <ListHeading title="Upcoming" />

                <FlatList
                    data={UPCOMING_SUBSCRIPTIONS}
                    renderItem={renderUpcomingItem}
                    keyExtractor={keyUpcomingById}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    ListEmptyComponent={<Text className="home-empty-state">No upcoming renewals yet.</Text>}
                />
            </View>

            <ListHeading title="All Subscriptions" />
        </>
    );

    /** Renders a subscription card with expand/collapse behavior. */
    const renderSubscriptionItem = ({ item }: { item: Subscription }) => (
        <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() => handleSubscriptionPress(item.id)}
        />
    );

    /** Returns the stable key for a subscription row. */
    const keySubscriptionById = (item: Subscription) => item.id;

    /** Renders vertical spacing between subscription cards. */
    const renderItemSeparator = () => <View className="h-4" />;

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
                <FlatList
                    ListHeaderComponent={renderListHeader}
                    data={HOME_SUBSCRIPTIONS}
                    keyExtractor={keySubscriptionById}
                    renderItem={renderSubscriptionItem}
                    extraData={expandedSubscriptionId}
                    ItemSeparatorComponent={renderItemSeparator}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text className="home-empty-state">No subscriptions yet.</Text>}
                    contentContainerClassName="pb-30"
                />
        </SafeAreaView>
    );
}