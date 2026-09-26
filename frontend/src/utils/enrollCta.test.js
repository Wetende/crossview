import { describe, expect, it } from "vitest";

import { buildEnrollCta, getEnrollCtaLabel } from "./enrollCta";

const formatCurrency = (amount) =>
    `KSh ${Number(amount).toLocaleString("en-US")}`;

describe("enrollment CTA wording", () => {
    it("matches the public course page for every enrollment mode", () => {
        expect(
            getEnrollCtaLabel({
                ctaState: "not_enrolled_paid",
                enrollmentMode: "paid",
                priceDisplay: { price: 1500, paymentCollection: "online" },
                formatCurrency,
            }),
        ).toBe("GET COURSE - KSh 1,500");
        expect(
            getEnrollCtaLabel({
                ctaState: "not_enrolled_paid",
                enrollmentMode: "paid",
                priceDisplay: { price: 1500, paymentCollection: "offline" },
                formatCurrency,
            }),
        ).toBe("PAY OFFLINE - KSh 1,500");
        expect(
            getEnrollCtaLabel({
                ctaState: "not_enrolled",
                enrollmentMode: "approval",
                formatCurrency,
            }),
        ).toBe("REQUEST ENROLLMENT");
        expect(
            getEnrollCtaLabel({
                ctaState: "not_enrolled",
                enrollmentMode: "free",
                formatCurrency,
            }),
        ).toBe("ENROLL NOW");
    });

    it("builds the preview CTA from the server's enrollment inputs", () => {
        expect(
            buildEnrollCta(
                {
                    href: "/programs/intro-ai/",
                    ctaState: "not_enrolled_paid",
                    enrollmentMode: "paid",
                    priceDisplay: {
                        cardDisplay: "price",
                        effectivePrice: 2000,
                        paymentCollection: "offline",
                    },
                },
                formatCurrency,
            ),
        ).toEqual({
            href: "/programs/intro-ai/",
            label: "PAY OFFLINE - KSh 2,000",
        });
        expect(buildEnrollCta(null, formatCurrency)).toBeNull();
    });
});
