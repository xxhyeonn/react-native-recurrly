import SubscriptionCard from "@/components/SubscriptionCard";
import { useSubscriptions } from "@/context/SubscriptionsContext";
import "@/global.css";
import { styled } from "nativewind";
import { useMemo, useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

/** Subscriptions tab screen with a search bar and expandable subscription cards. */
const Subscriptions = () => {
    const [query, setQuery] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const { subscriptions } = useSubscriptions();

    /** Filters subscriptions by name, category, or plan matching the search query. */
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return subscriptions;
        return subscriptions.filter(
            (s) =>
                s.name.toLowerCase().includes(q) ||
                s.category?.toLowerCase().includes(q) ||
                s.plan?.toLowerCase().includes(q)
        );
    }, [query]);

    /** Toggles the expanded card; collapses if the same card is tapped again. */
    const handlePress = (id: string) => {
        setExpandedId((current) => (current === id ? null : id));
    };

    /** Renders a single subscription card with expand/collapse behaviour. */
    const renderItem = ({ item }: { item: Subscription }) => (
        <SubscriptionCard
            {...item}
            expanded={expandedId === item.id}
            onPress={() => handlePress(item.id)}
        />
    );

    /** Stable key extractor for FlatList. */
    const keyExtractor = (item: Subscription) => item.id;

    /** Vertical gap between cards. */
    const renderSeparator = () => <View className="h-4" />;

    /** Empty state shown when the search returns no results. */
    const renderEmpty = () => (
        <Text className="home-empty-state">
            {query.trim() ? "No subscriptions match your search." : "No subscriptions yet."}
        </Text>
    );

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            {/* Screen heading */}
            <Text className="text-2xl font-sans-bold text-primary mb-5">Subscriptions</Text>

            {/* Search bar */}
            <View className="rounded-2xl border border-border bg-card px-4 mb-5">
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search subscriptions…"
                    placeholderTextColor="rgba(0,0,0,0.35)"
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                    className="py-4 text-base font-sans-medium text-primary"
                />
            </View>

            <FlatList
                data={filtered}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                extraData={expandedId}
                ItemSeparatorComponent={renderSeparator}
                ListEmptyComponent={renderEmpty}
                showsVerticalScrollIndicator={false}
                contentContainerClassName="pb-30"
            />
        </SafeAreaView>
    );
};

export default Subscriptions;
