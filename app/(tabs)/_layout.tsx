import { tabs } from "@/constants/data";
import { colors, components } from "@/constants/theme";
import { useAuth } from "@clerk/expo";
import { clsx } from "clsx";
import { Redirect, Tabs } from "expo-router";
import { Image, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const tabBar = components.tabBar;

/** Renders a tab bar icon with an active-state pill highlight. */
const TabIcon = ({ focused, icon }: TabIconProps) => {
    return (
        <View className="tabs-icon">
            <View className={clsx('tabs-pill', focused && 'tabs-active')}>
                <Image source={icon} resizeMode="contain" className="tabs-glyph"/>
            </View>
        </View>
    );
};

/** Tab navigator that requires authentication before rendering main app screens. */
const TabsLayout = () => {
    const insets = useSafeAreaInsets();
    const { isSignedIn, isLoaded } = useAuth();

    // Wait for Clerk before deciding whether to redirect.
    if (!isLoaded) return null;

    // Unauthenticated visitors should land on sign-in, not the tabs.
    if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;

    /** Renders the icon for a single tab screen. */
    const renderTabBarIcon = (icon: TabIconProps["icon"]) =>
        ({ focused }: { focused: boolean }) => (
            <TabIcon focused={focused} icon={icon} />
        );

    return (
        <Tabs
            screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: false,
                    tabBarStyle: {
                            position: 'absolute',
                            bottom: Math.max(insets.bottom, tabBar.horizontalInset),
                            height: tabBar.height,
                            marginHorizontal: tabBar.horizontalInset,
                            borderRadius: tabBar.radius,
                            backgroundColor: colors.primary,
                            borderTopWidth: 0,
                            elevation: 0,
                    },
                    tabBarItemStyle: {
                            paddingVertical: tabBar.height / 2 - tabBar.iconFrame / 1.6
                    },
                    tabBarIconStyle: {
                            width: tabBar.iconFrame,
                            height: tabBar.iconFrame,
                            alignItems: 'center'
                    }
        }}
        >
                {tabs.map((tab) => (
                    <Tabs.Screen
                        key={tab.name}
                        name={tab.name}
                        options={{
                                title: tab.title,
                                tabBarIcon: renderTabBarIcon(tab.icon)
                        }}/>
                ))}
        </Tabs>
    )
}

export default TabsLayout;