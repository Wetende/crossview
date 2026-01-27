/**
 * ProgramManageCard - Instructor/Admin program management card
 * MasterStudy LMS inspired design for course management
 * Uses theme colors (Chameleon engine - no hardcoded colors)
 */

import { Link } from "@inertiajs/react";
import {
    Box,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    Chip,
    Stack,
    Rating,
    useTheme,
} from "@mui/material";
import { IconEye, IconCircleFilled, IconTools, IconFileDescription } from "@tabler/icons-react";

// Badge colors using theme palette
const getBadgeColor = (type, theme) => {
    switch (type) {
        case "hot":
            return theme.palette.error.main;
        case "new":
            return theme.palette.success.main;
        case "special":
            return theme.palette.warning.main;
        default:
            return theme.palette.primary.main;
    }
};

export default function ProgramManageCard({
    program,
    onMakeFeatured,
    showMakeFeatured = true,
}) {
    const theme = useTheme();

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 30) return `${diffDays} days ago`;
        if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} ${months === 1 ? "month" : "months"} ago`;
        }
        const years = Math.floor(diffDays / 365);
        return `${years} ${years === 1 ? "year" : "years"} ago`;
    };

    // Get price display
    const getPriceDisplay = () => {
        const price = program.price || 0;
        const originalPrice = program.originalPrice;

        if (price === 0) return { text: "Free", hasDiscount: false };
        if (originalPrice && originalPrice > price) {
            return {
                text: `$${price}`,
                original: `$${originalPrice}`,
                hasDiscount: true,
            };
        }
        return { text: `$${price}`, hasDiscount: false };
    };

    const priceInfo = getPriceDisplay();
    const isPublished = program.isPublished || program.is_published;

    return (
        <Card
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 2,
                overflow: "hidden",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: theme.shadows[8],
                },
            }}
        >
            {/* Thumbnail with optional badge */}
            <Box sx={{ position: "relative" }}>
                <CardMedia
                    component="img"
                    height="160"
                    image={
                        program.thumbnail ||
                        "/static/images/course-placeholder.svg"
                    }
                    alt={program.name}
                    sx={{ objectFit: "cover" }}
                />
                {program.badgeType && (
                    <Chip
                        label={program.badgeType.toUpperCase()}
                        size="small"
                        sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            bgcolor: getBadgeColor(program.badgeType, theme),
                            color: "white",
                            fontWeight: 700,
                            fontSize: "0.65rem",
                            height: 22,
                        }}
                    />
                )}
            </Box>

            <CardContent
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    p: 2,
                }}
            >
                {/* Category */}
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                >
                    {program.category || "General"}
                </Typography>

                {/* Title */}
                <Typography
                    component={Link}
                    href={`/instructor/programs/${program.id}/`}
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{
                        mb: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: 48,
                        textDecoration: "none",
                        color: "text.primary",
                        "&:hover": { color: "primary.main" },
                    }}
                >
                    {program.name}
                </Typography>

                {/* Rating + Views Row */}
                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ mb: 1.5 }}
                >
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Rating
                            value={program.rating || 0}
                            precision={0.1}
                            size="small"
                            readOnly
                        />
                        <Typography variant="caption" color="text.secondary">
                            {program.rating?.toFixed(1) || "0"} (
                            {program.reviewCount || 0})
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <IconEye
                            size={14}
                            color={theme.palette.text.secondary}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {program.viewCount || program.enrollmentCount || 0}
                        </Typography>
                    </Stack>
                </Stack>

                {/* Published Status + Price Row */}
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 2 }}
                >
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <IconCircleFilled
                            size={10}
                            color={
                                isPublished
                                    ? theme.palette.success.main
                                    : theme.palette.grey[400]
                            }
                        />
                        <Typography variant="caption" color="text.secondary">
                            {isPublished ? "Published" : "Draft"}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        {priceInfo.hasDiscount && (
                            <Typography
                                variant="caption"
                                sx={{
                                    textDecoration: "line-through",
                                    color: "text.disabled",
                                }}
                            >
                                {priceInfo.original}
                            </Typography>
                        )}
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            color={
                                priceInfo.text === "Free"
                                    ? "success.main"
                                    : "text.primary"
                            }
                        >
                            {priceInfo.text}
                        </Typography>
                    </Stack>
                </Stack>

                {/* Action Buttons */}
                {showMakeFeatured && (
                    <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                         <Button
                            component={Link}
                            href={`/instructor/programs/${program.id}/`}
                            variant="outlined"
                            fullWidth
                            // startIcon={<IconFileDescription size={16} />}
                            sx={{
                                fontWeight: 700,
                                py: 1,
                                fontSize: '0.75rem',
                                color: theme.palette.text.primary,
                                borderColor: theme.palette.divider,
                                "&:hover": {
                                    borderColor: theme.palette.text.primary,
                                    bgcolor: 'transparent'
                                }
                            }}
                        >
                            Details
                        </Button>
                        <Button
                            component={Link}
                            href={`/instructor/programs/${program.id}/manage/`}
                            variant="contained"
                            fullWidth
                            // startIcon={<IconTools size={16} />}
                            sx={{
                                bgcolor: theme.palette.primary.main,
                                color: "white",
                                fontWeight: 700,
                                py: 1,
                                fontSize: '0.75rem',
                                "&:hover": {
                                    bgcolor: theme.palette.primary.dark,
                                },
                            }}
                        >
                            Builder
                        </Button>
                    </Stack>
                )}

                {/* Last Updated */}
                {program.updatedAt && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1.5, textAlign: "center" }}
                    >
                        Last updated: {formatDate(program.updatedAt)}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}
