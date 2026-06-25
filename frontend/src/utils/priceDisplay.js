const VALID_CARD_DISPLAYS = new Set(["free", "price", "hidden"]);

const toNumber = (value) => {
    const numeric = Number(value || 0);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
};

export function resolvePriceDisplay(program = {}) {
    const display = program.priceDisplay || {};
    const price = toNumber(display.price ?? program.price);
    const originalPrice = toNumber(
        display.originalPrice ?? program.originalPrice ?? program.original_price,
    );
    const rawCardDisplay =
        display.cardDisplay || display.card_display || (price > 0 ? "price" : "free");
    let cardDisplay = VALID_CARD_DISPLAYS.has(rawCardDisplay)
        ? rawCardDisplay
        : price > 0
          ? "price"
          : "free";

    if (cardDisplay === "price" && price <= 0) {
        cardDisplay = "free";
    }
    if (cardDisplay === "free" && price > 0) {
        cardDisplay = "price";
    }

    return {
        cardDisplay,
        paymentCollection:
            display.paymentCollection || display.payment_collection || "none",
        price,
        originalPrice,
        isHidden: cardDisplay === "hidden",
        showFree: cardDisplay === "free",
        showPrice: cardDisplay === "price" && price > 0,
        hasDiscount: originalPrice > price && price > 0,
    };
}
