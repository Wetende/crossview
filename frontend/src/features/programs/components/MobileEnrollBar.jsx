import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import { Box, Button, GlobalStyles, Paper, Stack, Typography } from "@mui/material";

import { useCurrency } from "@/hooks/useCurrency";
import { resolvePriceDisplay } from "@/utils/priceDisplay";
import { ENROLL_BAR_HEIGHT_VAR } from "../utils/enrollBar";
import { resolvePrimaryCta } from "../utils/primaryCta";

function useMeasuredHeight() {
    const ref = useRef(null);
    const [height, setHeight] = useState(0);

    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return undefined;
        const measure = () =>
            setHeight(Math.ceil(node.getBoundingClientRect().height));
        measure();
        if (typeof ResizeObserver === "undefined") return undefined;
        const observer = new ResizeObserver(measure);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return [ref, height];
}

// Fixed bottom enrol bar for phones and small tablets. The desktop details
// card stays the primary surface on md and up, so the bar is hidden there.
export default function MobileEnrollBar({
    program,
    enrollmentStatus,
    enrollmentMode,
    ctaState,
    onBuyNow,
}) {
    const { formatCurrency } = useCurrency();
    const [barRef, barHeight] = useMeasuredHeight();

    const priceDisplay = resolvePriceDisplay(program);
    const isEnrolled = enrollmentStatus === "enrolled";
    const showPrice = !isEnrolled && !priceDisplay.isHidden;
    const cta = resolvePrimaryCta({
        program,
        enrollmentStatus,
        enrollmentMode,
        ctaState,
        priceDisplay,
        formatCurrency,
        includePrice: !showPrice,
    });

    const buttonProps =
        cta.kind === "link"
            ? { component: Link, href: cta.href }
            : cta.kind === "action"
              ? { onClick: () => onBuyNow?.(program.id) }
              : { disabled: true };

    return (
        <>
            <GlobalStyles
                styles={(theme) => ({
                    ":root": { [ENROLL_BAR_HEIGHT_VAR]: `${barHeight}px` },
                    // Keep keyboard-focused elements from scrolling under the bar.
                    html: {
                        [theme.breakpoints.down("md")]: {
                            scrollPaddingBottom: `var(${ENROLL_BAR_HEIGHT_VAR})`,
                        },
                    },
                })}
            />
            <Paper
                ref={barRef}
                component="section"
                aria-label="Enrolment"
                elevation={8}
                square
                sx={{
                    position: "fixed",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: "appBar",
                    display: { xs: "flex", md: "none" },
                    alignItems: "center",
                    gap: 2,
                    px: 2,
                    pt: 1.5,
                    pb: "calc(12px + env(safe-area-inset-bottom, 0px))",
                    bgcolor: "background.paper",
                    borderTop: 1,
                    borderColor: "divider",
                }}
            >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    {showPrice ? (
                        <Stack
                            direction="row"
                            spacing={1}
                            sx={{ alignItems: "baseline", flexWrap: "wrap" }}
                        >
                            <Typography variant="h6" component="p" sx={{ fontWeight: 800 }}>
                                {priceDisplay.showPrice
                                    ? formatCurrency(priceDisplay.price)
                                    : "Free"}
                            </Typography>
                            {priceDisplay.hasDiscount ? (
                                <Typography
                                    variant="body2"
                                    color="textSecondary"
                                    sx={{ textDecoration: "line-through" }}
                                >
                                    {formatCurrency(priceDisplay.originalPrice)}
                                </Typography>
                            ) : null}
                        </Stack>
                    ) : (
                        <Typography
                            variant="subtitle2"
                            component="p"
                            sx={{ fontWeight: 700 }}
                            noWrap
                        >
                            {program.name}
                        </Typography>
                    )}
                </Box>
                <Button
                    {...buttonProps}
                    variant={cta.variant}
                    size="large"
                    sx={{
                        flexShrink: 0,
                        maxWidth: "60%",
                        minHeight: 44,
                        py: 1,
                        fontWeight: 700,
                        lineHeight: 1.25,
                        whiteSpace: "normal",
                        textAlign: "center",
                    }}
                >
                    {cta.label}
                </Button>
            </Paper>
        </>
    );
}
