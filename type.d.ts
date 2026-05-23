import type { ImageSourcePropType } from "react-native";

declare global {
    /** Tab definition used by the bottom tab navigator. */
    interface AppTab {
        name: string;
        title: string;
        icon: ImageSourcePropType;
    }

    /** Props for rendering a single tab bar icon. */
    interface TabIconProps {
        focused: boolean;
        icon: ImageSourcePropType;
    }

    /** Subscription record shown on the home and subscriptions screens. */
    interface Subscription {
        id: string;
        icon: ImageSourcePropType;
        name: string;
        plan?: string;
        category?: string;
        paymentMethod?: string;
        status?: string;
        startDate?: string;
        price: number;
        currency?: string;
        billing: string;
        renewalDate?: string;
        color?: string;
    }

    /** Props for the expandable subscription card component. */
    interface SubscriptionCardProps extends Omit<Subscription, "id"> {
        expanded: boolean;
        onPress: () => void;
        onCancelPress?: () => void;
        isCancelling?: boolean;
    }

    /** Upcoming renewal item rendered in the horizontal home list. */
    interface UpcomingSubscription {
        id: string;
        icon: ImageSourcePropType;
        name: string;
        price: number;
        currency?: string;
        daysLeft: number;
    }

    /** Props for the upcoming subscription card component. */
    interface UpcomingSubscriptionCardProps
        extends Omit<UpcomingSubscription, "id"> {}

    /** Props for section headings with an optional view-all action. */
    interface ListHeadingProps {
        title: string;
        onPressViewAll?: () => void;
    }
}

export { };
