import { describe, expect, test } from "vitest";

import { resolvePriceDisplay } from "./priceDisplay";

describe("resolvePriceDisplay", () => {
    test("uses explicit hidden display instead of inferring Free", () => {
        expect(
            resolvePriceDisplay({
                price: 0,
                priceDisplay: { cardDisplay: "hidden" },
            }),
        ).toMatchObject({
            cardDisplay: "hidden",
            isHidden: true,
            showFree: false,
            showPrice: false,
        });
    });

    test("shows Free for learner-free courses", () => {
        expect(resolvePriceDisplay({ price: 0 })).toMatchObject({
            cardDisplay: "free",
            showFree: true,
        });
    });

    test("shows price and discount when card display is price", () => {
        expect(
            resolvePriceDisplay({
                priceDisplay: {
                    cardDisplay: "price",
                    price: 5000,
                    originalPrice: 7000,
                },
            }),
        ).toMatchObject({
            cardDisplay: "price",
            showPrice: true,
            price: 5000,
            originalPrice: 7000,
            hasDiscount: true,
        });
    });

    test("prefers effective scheduled price and exposes sale information", () => {
        expect(
            resolvePriceDisplay({
                price: 80,
                priceDisplay: {
                    cardDisplay: "price",
                    price: 100,
                    effectivePrice: 80,
                    regularPrice: 100,
                    saleActive: true,
                    saleStartsAt: "2026-07-10T00:00:00+00:00",
                    saleEndsAt: "2026-07-17T00:00:00+00:00",
                    priceInfo: "Includes all materials",
                },
            }),
        ).toMatchObject({
            price: 80,
            originalPrice: 100,
            hasDiscount: true,
            saleActive: true,
            priceInfo: "Includes all materials",
        });
    });
});
