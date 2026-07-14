import { usePage } from "@inertiajs/react";

/**
 * useCurrency
 *
 * Reads platform currency settings when available and falls back to KES/KSh
 * so shared UI can format prices safely across repos.
 */
export function useCurrency() {
    const { platform } = usePage().props;

    const currencyCode = platform?.currencyCode || "KES";
    const currencySymbol = platform?.currencySymbol || "KSh\u00A0";

    const formatCurrency = (amount) => {
        if (amount == null) return `${currencySymbol}0`;
        const num = Number(amount);
        if (Number.isNaN(num)) return `${currencySymbol}0`;
        return `${currencySymbol}${num.toLocaleString()}`;
    };

    const formatMinorCurrency = (amountMinor) => {
        if (amountMinor == null) return `${currencySymbol}0`;
        return formatCurrency(Number(amountMinor) / 100);
    };

    return {
        currencyCode,
        currencySymbol,
        formatCurrency,
        formatMinorCurrency,
    };
}
