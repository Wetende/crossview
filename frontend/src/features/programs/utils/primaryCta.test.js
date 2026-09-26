import { describe, expect, test } from "vitest";

import { getEnrollCtaLabel, resolvePrimaryCta } from "./primaryCta";

const formatCurrency = (amount) => `KSh ${amount}`;
const program = { id: 7 };
const paidDisplay = { price: 1500, paymentCollection: "online" };
const freeDisplay = { price: 0, paymentCollection: "none" };

const resolve = (overrides = {}) =>
    resolvePrimaryCta({
        program,
        enrollmentStatus: null,
        enrollmentMode: "free",
        ctaState: "not_enrolled",
        priceDisplay: freeDisplay,
        formatCurrency,
        ...overrides,
    });

describe("getEnrollCtaLabel", () => {
    test("labels paid, offline, approval and free enrolment", () => {
        expect(
            getEnrollCtaLabel({
                ctaState: "not_enrolled_paid",
                priceDisplay: paidDisplay,
                formatCurrency,
            }),
        ).toBe("GET COURSE - KSh 1500");
        expect(
            getEnrollCtaLabel({
                ctaState: "not_enrolled_paid",
                priceDisplay: { ...paidDisplay, paymentCollection: "offline" },
                formatCurrency,
            }),
        ).toBe("PAY OFFLINE - KSh 1500");
        expect(
            getEnrollCtaLabel({
                ctaState: "not_enrolled",
                enrollmentMode: "approval",
                priceDisplay: freeDisplay,
                formatCurrency,
            }),
        ).toBe("REQUEST ENROLLMENT");
        expect(
            getEnrollCtaLabel({
                ctaState: "not_enrolled",
                enrollmentMode: "free",
                priceDisplay: freeDisplay,
                formatCurrency,
            }),
        ).toBe("ENROLL NOW");
    });

    test("can leave the amount out when the price is shown beside the button", () => {
        expect(
            getEnrollCtaLabel({
                ctaState: "not_enrolled_paid",
                priceDisplay: paidDisplay,
                formatCurrency,
                includePrice: false,
            }),
        ).toBe("GET COURSE");
    });
});

describe("resolvePrimaryCta", () => {
    test("continues studying when enrolled", () => {
        expect(resolve({ enrollmentStatus: "enrolled", ctaState: "enrolled" })).toEqual({
            kind: "link",
            label: "CONTINUE STUDYING",
            href: "/student/programs/7/resume/",
            variant: "contained",
        });
    });

    test("blocks enrolment while prerequisites are missing", () => {
        expect(resolve({ ctaState: "prerequisites_required" })).toEqual({
            kind: "disabled",
            label: "PREREQUISITES REQUIRED",
            variant: "outlined",
        });
    });

    test("sends pending payments to orders", () => {
        expect(resolve({ ctaState: "pending_payment" })).toEqual({
            kind: "link",
            label: "COMPLETE PAYMENT",
            href: "/student/orders/",
            variant: "outlined",
        });
    });

    test("shows pending enrolment requests as disabled", () => {
        expect(resolve({ enrollmentStatus: "pending", ctaState: "pending" })).toEqual({
            kind: "disabled",
            label: "ENROLLMENT PENDING",
            variant: "outlined",
        });
    });

    test("uses the enrol action otherwise", () => {
        expect(
            resolve({
                ctaState: "not_enrolled_paid",
                enrollmentMode: "paid",
                priceDisplay: paidDisplay,
            }),
        ).toEqual({
            kind: "action",
            label: "GET COURSE - KSh 1500",
            variant: "contained",
        });
    });
});
