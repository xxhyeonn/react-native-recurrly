import dayjs from "dayjs";

/**
 * Formats a numeric amount as a localized currency string.
 * @param value - Amount to format.
 * @param currency - ISO 4217 currency code.
 * @returns Formatted currency string.
 */
export const formatCurrency = (value: number, currency = "USD"): string => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
};

/**
 * Formats an ISO date string for display, or returns a fallback label.
 * @param value - ISO date string to format.
 * @returns Formatted date or fallback text.
 */
export const formatSubscriptionDateTime = (value?: string): string => {
  if (!value) return "Not provided";
  const parsedDate = dayjs(value);
  return parsedDate.isValid() ? parsedDate.format("MM/DD/YYYY") : "Not provided";
};

/**
 * Capitalizes the first letter of a subscription status label.
 * @param value - Raw status value from the API or mock data.
 * @returns Human-readable status label.
 */
export const formatStatusLabel = (value?: string): string => {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
};