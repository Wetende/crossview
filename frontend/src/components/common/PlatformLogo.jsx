import PropTypes from "prop-types";
import { Link } from "@inertiajs/react";
import { Box, Stack, Typography } from "@mui/material";
import { IconSchool } from "@tabler/icons-react";

/**
 * Shared platform logo component used across public/auth/dashboard surfaces.
 * Uses uploaded platform logo when present, with a consistent fallback mark.
 */
export default function PlatformLogo({
    platform,
    href,
    showName = true,
    showNameWhenLogo = false,
    showNameWhenNoLogo = true,
    fallbackName = "LMS",
    logoHeight = 40,
    logoMaxWidth = 160,
    iconContainerSize = 40,
    iconSize = 24,
    iconBgColor = "primary.main",
    iconColor = "white",
    nameVariant = "h6",
    nameColor = "text.primary",
    nameFontWeight = 700,
    imageFilter,
    gap = 1.5,
    sx,
    imageSx,
    nameSx,
}) {
    const institutionName = platform?.institutionName || fallbackName;
    const logoUrl = platform?.logoUrl || "";
    const hasLogo = Boolean(logoUrl);
    const shouldShowName =
        showName &&
        ((hasLogo && showNameWhenLogo) || (!hasLogo && showNameWhenNoLogo));

    const mark = hasLogo ? (
        <Box
            component="img"
            src={logoUrl}
            alt={institutionName}
            sx={{
                height: logoHeight,
                maxWidth: logoMaxWidth,
                width: "auto",
                objectFit: "contain",
                display: "block",
                ...(imageFilter ? { filter: imageFilter } : {}),
                ...imageSx,
            }}
        />
    ) : (
        <Box
            sx={{
                width: iconContainerSize,
                height: iconContainerSize,
                bgcolor: iconBgColor,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: iconColor,
                flexShrink: 0,
            }}
        >
            <IconSchool size={iconSize} />
        </Box>
    );

    const content = shouldShowName ? (
        <Stack direction="row" spacing={gap} alignItems="center">
            {mark}
            <Typography
                variant={nameVariant}
                color={nameColor}
                fontWeight={nameFontWeight}
                sx={nameSx}
            >
                {institutionName}
            </Typography>
        </Stack>
    ) : (
        mark
    );

    return (
        <Box
            {...(href ? { component: Link, href } : {})}
            sx={{
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
                color: "inherit",
                ...sx,
            }}
        >
            {content}
        </Box>
    );
}

PlatformLogo.propTypes = {
    platform: PropTypes.shape({
        logoUrl: PropTypes.string,
        institutionName: PropTypes.string,
    }),
    href: PropTypes.string,
    showName: PropTypes.bool,
    showNameWhenLogo: PropTypes.bool,
    showNameWhenNoLogo: PropTypes.bool,
    fallbackName: PropTypes.string,
    logoHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    logoMaxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    iconContainerSize: PropTypes.number,
    iconSize: PropTypes.number,
    iconBgColor: PropTypes.string,
    iconColor: PropTypes.string,
    nameVariant: PropTypes.string,
    nameColor: PropTypes.string,
    nameFontWeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    imageFilter: PropTypes.string,
    gap: PropTypes.number,
    sx: PropTypes.object,
    imageSx: PropTypes.object,
    nameSx: PropTypes.object,
};
