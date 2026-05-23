import { HOME_SUBSCRIPTIONS } from "@/constants/data";
import React, { createContext, useCallback, useContext, useState } from "react";

// ─── types ───────────────────────────────────────────────────────────────────

interface SubscriptionsContextValue {
    /** Full, ordered list of subscriptions (newest first after creation). */
    subscriptions: Subscription[];
    /** Prepends a new subscription to the list. */
    addSubscription: (subscription: Subscription) => void;
}

// ─── context ─────────────────────────────────────────────────────────────────

const SubscriptionsContext = createContext<SubscriptionsContextValue | null>(null);

// ─── provider ────────────────────────────────────────────────────────────────

/** Provides the shared subscriptions list to all descendant screens. */
export const SubscriptionsProvider = ({ children }: { children: React.ReactNode }) => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>(HOME_SUBSCRIPTIONS);

    const addSubscription = useCallback((subscription: Subscription) => {
        setSubscriptions((prev) => [subscription, ...prev]);
    }, []);

    return (
        <SubscriptionsContext.Provider value={{ subscriptions, addSubscription }}>
            {children}
        </SubscriptionsContext.Provider>
    );
};

// ─── hook ────────────────────────────────────────────────────────────────────

/** Returns the subscriptions context. Must be used inside <SubscriptionsProvider>. */
export const useSubscriptions = (): SubscriptionsContextValue => {
    const ctx = useContext(SubscriptionsContext);
    if (!ctx) {
        throw new Error("useSubscriptions must be used within a SubscriptionsProvider");
    }
    return ctx;
};
