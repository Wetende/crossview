import { getEnrollCtaLabel } from "@/features/programs/utils/primaryCta";
import { resolvePriceDisplay } from "@/utils/priceDisplay";

// The wording lives in primaryCta.js (public course page); the free preview
// player reuses it so both always say the same thing for the same course.
export { getEnrollCtaLabel };

/**
 * Turn the server's `preview.enrollCta` inputs into `{ href, label }`.
 */
export const buildEnrollCta = (enrollCta, formatCurrency) => {
    if (!enrollCta?.href) return null;
    return {
        href: enrollCta.href,
        label: getEnrollCtaLabel({
            ctaState: enrollCta.ctaState,
            enrollmentMode: enrollCta.enrollmentMode,
            priceDisplay: resolvePriceDisplay({
                priceDisplay: enrollCta.priceDisplay,
            }),
            formatCurrency,
        }),
    };
};
