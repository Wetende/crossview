// Primary enrolment call to action for the public course page. The desktop
// details card and the mobile enrol bar both read their label and target from
// here, so the enrolment rules live in one place.

export const ORDERS_HREF = "/student/orders/";

export function getProgramResumeHref(program) {
    return `/student/programs/${program.id}/resume/`;
}

export function getEnrollCtaLabel({
    ctaState,
    enrollmentMode,
    priceDisplay,
    formatCurrency,
    includePrice = true,
}) {
    if (ctaState === "not_enrolled_paid") {
        const action =
            priceDisplay.paymentCollection === "offline" ? "PAY OFFLINE" : "GET COURSE";
        return includePrice
            ? `${action} - ${formatCurrency(priceDisplay.price)}`
            : action;
    }
    if (enrollmentMode === "approval") {
        return "REQUEST ENROLLMENT";
    }
    return "ENROLL NOW";
}

export function resolvePrimaryCta({
    program,
    enrollmentStatus,
    enrollmentMode,
    ctaState,
    priceDisplay,
    formatCurrency,
    includePrice = true,
}) {
    if (enrollmentStatus === "enrolled") {
        return {
            kind: "link",
            label: "CONTINUE STUDYING",
            href: getProgramResumeHref(program),
            variant: "contained",
        };
    }
    if (ctaState === "prerequisites_required") {
        return { kind: "disabled", label: "PREREQUISITES REQUIRED", variant: "outlined" };
    }
    if (ctaState === "pending_payment") {
        return {
            kind: "link",
            label: "COMPLETE PAYMENT",
            href: ORDERS_HREF,
            variant: "outlined",
        };
    }
    if (enrollmentStatus === "pending") {
        return { kind: "disabled", label: "ENROLLMENT PENDING", variant: "outlined" };
    }
    return {
        kind: "action",
        label: getEnrollCtaLabel({
            ctaState,
            enrollmentMode,
            priceDisplay,
            formatCurrency,
            includePrice,
        }),
        variant: "contained",
    };
}
