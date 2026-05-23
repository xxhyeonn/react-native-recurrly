import { colors } from "@/constants/theme";
import { icons } from "@/constants/icons";
import "@/global.css";
import { clsx } from "clsx";
import dayjs from "dayjs";
import { styled } from "nativewind";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput as RNTextInput,
    View,
} from "react-native";

const TextInput = styled(RNTextInput);

// ─── constants ───────────────────────────────────────────────────────────────

type Frequency = "Monthly" | "Yearly";

const CATEGORIES = [
    "Entertainment",
    "AI Tools",
    "Developer Tools",
    "Design",
    "Productivity",
    "Cloud",
    "Music",
    "Other",
] as const;

type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<Category, string> = {
    Entertainment: "#f0e6ff",
    "AI Tools": "#b8d4e3",
    "Developer Tools": "#e8def8",
    Design: "#f5c542",
    Productivity: "#b8e8d0",
    Cloud: "#c9e8f5",
    Music: "#8fd1bd",
    Other: "#f6eecf",
};

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Calculates a renewal date from today based on billing frequency. */
function calcRenewalDate(frequency: Frequency): string {
    const today = dayjs();
    return frequency === "Monthly"
        ? today.add(1, "month").toISOString()
        : today.add(1, "year").toISOString();
}

/** Returns true when the string is a positive finite number. */
function isPositiveNumber(v: string): boolean {
    const n = parseFloat(v);
    return isFinite(n) && n > 0;
}

// ─── types ───────────────────────────────────────────────────────────────────

interface Props {
    visible: boolean;
    onClose: () => void;
    onSubmit: (subscription: Subscription) => void;
}

// ─── component ───────────────────────────────────────────────────────────────

/** Bottom-sheet modal for creating a new subscription. */
const CreateSubscriptionModal = ({ visible, onClose, onSubmit }: Props) => {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [frequency, setFrequency] = useState<Frequency>("Monthly");
    const [category, setCategory] = useState<Category | null>(null);

    // Validation flags
    const isNameValid = name.trim().length > 0;
    const isPriceValid = isPositiveNumber(price);
    const isFormValid = isNameValid && isPriceValid;

    // ── handlers ─────────────────────────────────────────────────────────────

    /** Resets all form fields to their initial state. */
    function resetForm() {
        setName("");
        setPrice("");
        setFrequency("Monthly");
        setCategory(null);
    }

    /** Closes the modal and resets the form. */
    function handleClose() {
        resetForm();
        onClose();
    }

    /** Builds a Subscription object and passes it to the parent. */
    function handleSubmit() {
        if (!isFormValid) return;

        const today = dayjs().toISOString();
        const selectedCategory = category ?? "Other";

        const newSubscription: Subscription = {
            id: `custom-${Date.now()}`,
            name: name.trim(),
            price: parseFloat(price),
            currency: "USD",
            billing: frequency,
            frequency: frequency,
            category: selectedCategory,
            status: "active",
            startDate: today,
            renewalDate: calcRenewalDate(frequency),
            icon: icons.wallet,
            color: CATEGORY_COLORS[selectedCategory],
        } as Subscription;

        onSubmit(newSubscription);
        resetForm();
        onClose();
    }

    // ─── render ──────────────────────────────────────────────────────────────

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                {/* Dimmed overlay — tapping it closes the modal */}
                <Pressable className="modal-overlay" onPress={handleClose}>
                    {/* Stop propagation so taps inside the sheet don't bubble up */}
                    <Pressable className="modal-container" onPress={(e) => e.stopPropagation()}>

                        {/* ── Header ─────────────────────────────────────── */}
                        <View className="modal-header">
                            <Text className="modal-title">New Subscription</Text>
                            <Pressable className="modal-close" onPress={handleClose} hitSlop={8}>
                                <Text className="modal-close-text">✕</Text>
                            </Pressable>
                        </View>

                        {/* ── Body ───────────────────────────────────────── */}
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View className="modal-body">

                                {/* Name */}
                                <View className="auth-field">
                                    <Text className="auth-label">Name</Text>
                                    <TextInput
                                        className="auth-input"
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="e.g. Netflix"
                                        placeholderTextColor={colors.mutedForeground}
                                        autoCorrect={false}
                                        returnKeyType="next"
                                    />
                                </View>

                                {/* Price */}
                                <View className="auth-field">
                                    <Text className="auth-label">Price (USD)</Text>
                                    <TextInput
                                        className="auth-input"
                                        value={price}
                                        onChangeText={setPrice}
                                        placeholder="0.00"
                                        placeholderTextColor={colors.mutedForeground}
                                        keyboardType="decimal-pad"
                                        returnKeyType="done"
                                    />
                                </View>

                                {/* Frequency */}
                                <View className="auth-field">
                                    <Text className="auth-label">Frequency</Text>
                                    <View className="picker-row">
                                        {(["Monthly", "Yearly"] as Frequency[]).map((option) => (
                                            <Pressable
                                                key={option}
                                                className={clsx(
                                                    "picker-option",
                                                    frequency === option && "picker-option-active"
                                                )}
                                                onPress={() => setFrequency(option)}
                                            >
                                                <Text
                                                    className={clsx(
                                                        "picker-option-text",
                                                        frequency === option && "picker-option-text-active"
                                                    )}
                                                >
                                                    {option}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>

                                {/* Category */}
                                <View className="auth-field">
                                    <Text className="auth-label">Category</Text>
                                    <View className="category-scroll">
                                        {CATEGORIES.map((cat) => (
                                            <Pressable
                                                key={cat}
                                                className={clsx(
                                                    "category-chip",
                                                    category === cat && "category-chip-active"
                                                )}
                                                onPress={() =>
                                                    setCategory((prev) => (prev === cat ? null : cat))
                                                }
                                            >
                                                <Text
                                                    className={clsx(
                                                        "category-chip-text",
                                                        category === cat && "category-chip-text-active"
                                                    )}
                                                >
                                                    {cat}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>

                                {/* Submit */}
                                <Pressable
                                    className={clsx(
                                        "auth-button",
                                        !isFormValid && "auth-button-disabled"
                                    )}
                                    onPress={handleSubmit}
                                    disabled={!isFormValid}
                                >
                                    <Text className="auth-button-text">Add Subscription</Text>
                                </Pressable>

                            </View>
                        </ScrollView>

                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default CreateSubscriptionModal;
