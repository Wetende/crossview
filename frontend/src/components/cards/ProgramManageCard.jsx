/**
 * ProgramManageCard - Instructor/Admin program management card
 * MasterStudy LMS inspired design for course management
 * Uses theme colors (Chameleon engine - no hardcoded colors)
 */

import { Link, router } from "@inertiajs/react";
import {
    Box,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Chip,
    Stack,
    Rating,
    useTheme,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    IconButton,
} from "@mui/material";
import {
    IconDotsVertical,
    IconFileDescription,
    IconPencil,
} from "@tabler/icons-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useState } from "react";
import CourseMetricStrip from "./CourseMetricStrip";

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
}) {
    const theme = useTheme();
    const { formatCurrency } = useCurrency();
    const [anchorEl, setAnchorEl] = useState(null);

    const detailHref = `/instructor/programs/${program.id}/`;
    const editHref = `/instructor/programs/${program.id}/manage/?tab=curriculum`;
    const unpublishHref = `/instructor/programs/${program.id}/unpublish/`;
    const open = Boolean(anchorEl);

    const handleCardClick = () => {
        router.visit(detailHref);
    };

    const handleCardKeyDown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            router.visit(detailHref);
        }
    };

    const handleMenuOpen = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = (event) => {
        event?.stopPropagation?.();
        setAnchorEl(null);
    };

    const handleMoveToDrafts = (event) => {
        event.stopPropagation();
        setAnchorEl(null);
        router.post(unpublishHref, {}, { preserveScroll: true });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "recently";
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return "recently";

        const now = new Date();
        const diffTime = Math.max(now - date, 0);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 1) return "recently";
        if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
        if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
        }
        if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} ${months === 1 ? "month" : "months"} ago`;
        }
        const years = Math.floor(diffDays / 365);
        return `${years} ${years === 1 ? "year" : "years"} ago`;
    };

    const getPriceDisplay = () => {
        const price = program.price || 0;
        const originalPrice = program.originalPrice ?? program.original_price;

        if (price === 0) return { text: "Free", hasDiscount: false };
        if (originalPrice && originalPrice > price) {
            return {
                text: formatCurrency(price),
                original: formatCurrency(originalPrice),
                hasDiscount: true,
            };
        }
        return { text: formatCurrency(price), hasDiscount: false };
    };

    const priceInfo = getPriceDisplay();
    const isPublished = program.isPublished || program.is_published;
    const reviewCount = program.reviewCount ?? program.review_count ?? 0;

    return (
        <Card
            onClick={handleCardClick}
            onKeyDown={handleCardKeyDown}
            role="button"
            tabIndex={0}
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 2,
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: theme.shadows[8],
                },
            }}
        >
            <Box sx={{ position: "relative" }}>
                <CardMedia
                    component="img" loading="lazy"
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
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1.5,
                        mb: 0.5,
                    }}
                >
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {program.category || "General"}
                    </Typography>
                    <Chip
                        label={isPublished ? "PUBLISHED" : "DRAFT"}
                        size="small"
                        sx={{
                            height: 20,
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            bgcolor: isPublished
                                ? theme.palette.success.main
                                : theme.palette.grey[400],
                            color: "white",
                            borderRadius: 1,
                            flexShrink: 0,
                        }}
                    />
                </Box>

                <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{
                        mb: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: 48,
                        color: "text.primary",
                        "&:hover": { color: "primary.main" },
                    }}
                >
                    {program.name}
                </Typography>

                <CourseMetricStrip
                    source={program}
                    sx={{
                        mb: 1.5,
                        borderColor: theme.palette.grey[200],
                        bgcolor: theme.palette.grey[50],
                    }}
                />

                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        mb: 2,
                    }}
                >
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Rating
                            value={program.rating || 0}
                            precision={0.1}
                            size="small"
                            readOnly
                        />
                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                            {program.rating?.toFixed(1) || "0.0"} ({reviewCount})
                        </Typography>
                    </Stack>
                    <Stack direction="column" alignItems="flex-end" spacing={-0.5}>
                        {priceInfo.hasDiscount && (
                            <Typography
                                variant="caption"
                                sx={{
                                    textDecoration: "line-through",
                                    color: "text.disabled",
                                    fontSize: "0.7rem",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {priceInfo.original}
                            </Typography>
                        )}
                        <Typography
                            variant="subtitle1"
                            fontWeight={800}
                            color="text.primary"
                            sx={{ whiteSpace: "nowrap" }}
                        >
                            {priceInfo.text}
                        </Typography>
	                    </Stack>
	                </Box>

                <Divider sx={{ mt: "auto", mb: 1.5 }} />

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1.5,
                    }}
                >
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Last updated:{" "}
                        <Box component="span" sx={{ color: "text.primary", fontWeight: 700 }}>
                            {formatDate(program.updatedAt || program.updated_at)}
                        </Box>
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={handleMenuOpen}
                        onKeyDown={(event) => event.stopPropagation()}
                        aria-label={`Course actions for ${program.name}`}
                        sx={{
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 1,
                            flexShrink: 0,
                        }}
                    >
                        <IconDotsVertical size={16} />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleMenuClose}
                        onClick={(event) => event.stopPropagation()}
                        transformOrigin={{ horizontal: "right", vertical: "bottom" }}
                        anchorOrigin={{ horizontal: "right", vertical: "top" }}
                        PaperProps={{
                            elevation: 3,
                            sx: { mt: 0.5, minWidth: 190, borderRadius: 2 },
                        }}
                    >
                        {isPublished && (
                            <MenuItem onClick={handleMoveToDrafts}>
                                <ListItemIcon>
                                    <IconFileDescription size={18} color={theme.palette.primary.main} />
                                </ListItemIcon>
                                <ListItemText primaryTypographyProps={{ variant: "body2", color: theme.palette.primary.main, fontWeight: 500 }}>
                                    Move to drafts
                                </ListItemText>
                            </MenuItem>
                        )}
                        {isPublished && <Divider sx={{ my: 0.5 }} />}
                        <MenuItem component={Link} href={editHref} onClick={handleMenuClose}>
                            <ListItemIcon>
                                <IconPencil size={18} color={theme.palette.text.secondary} />
                            </ListItemIcon>
                            <ListItemText primaryTypographyProps={{ variant: "body2", color: "text.secondary", fontWeight: 500 }}>
                                Edit
                            </ListItemText>
                        </MenuItem>
                    </Menu>
                </Box>

            </CardContent>
        </Card>
    );
}
