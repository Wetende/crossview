/**
 * ProgramManageCard - Instructor/Admin program management card
 * MasterStudy LMS inspired design for course management
 * Uses theme colors (Chameleon engine - no hardcoded colors)
 */

import { useState } from "react";
import { Link } from "@inertiajs/react";
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
    IconStar,
} from "@tabler/icons-react";
import { useCurrency } from "@/hooks/useCurrency";
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
    onMakeFeatured,
    showMakeFeatured = true,
}) {
    const theme = useTheme();
    const { formatCurrency } = useCurrency();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

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
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                >
                    {program.category || "General"}
                </Typography>

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

                <CourseMetricStrip
                    source={program}
                    sx={{
                        mb: 1.5,
                        borderColor: theme.palette.grey[200],
                        bgcolor: theme.palette.grey[50],
                    }}
                />

                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-end"
                    sx={{ mb: 2 }}
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
                                }}
                            >
                                {priceInfo.original}
                            </Typography>
                        )}
                        <Typography
                            variant="subtitle1"
                            fontWeight={800}
                            color="text.primary"
                        >
                            {priceInfo.text}
                        </Typography>
                    </Stack>
                </Stack>

                <Divider sx={{ mb: 1.5 }} />

                <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: "auto" }}>
                    <Stack spacing={0.5}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="caption" color="text.secondary">
                                Course status:
                            </Typography>
                            <Chip
                                label={isPublished ? "PUBLISHED" : "DRAFT"}
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: "0.6rem",
                                    fontWeight: 700,
                                    bgcolor: isPublished ? theme.palette.success.main : theme.palette.grey[400],
                                    color: "white",
                                    borderRadius: 1,
                                }}
                            />
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="caption" color="text.secondary">
                                Last updated: <strong>{formatDate(program.updatedAt || program.updated_at) || "recently"}</strong>
                            </Typography>
                        </Stack>
                    </Stack>

                    <Box>
                        <IconButton size="small" onClick={handleClick} sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
                            <IconDotsVertical size={16} />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                            transformOrigin={{ horizontal: "right", vertical: "bottom" }}
                            anchorOrigin={{ horizontal: "right", vertical: "top" }}
                            PaperProps={{
                                elevation: 3,
                                sx: { mt: 0.5, minWidth: 160, borderRadius: 2 },
                            }}
                        >
                            <MenuItem
                                component={Link}
                                href={`/instructor/programs/${program.id}/`}
                                onClick={handleClose}
                            >
                                <ListItemIcon>
                                    <IconFileDescription size={18} color={theme.palette.primary.main} />
                                </ListItemIcon>
                                <ListItemText primaryTypographyProps={{ variant: "body2", color: theme.palette.primary.main, fontWeight: 500 }}>
                                    Details
                                </ListItemText>
                            </MenuItem>
                            <Divider sx={{ my: 0.5 }} />
                            <MenuItem component={Link} href={`/instructor/programs/${program.id}/manage/`} onClick={handleClose}>
                                <ListItemIcon>
                                    <IconPencil size={18} color={theme.palette.text.secondary} />
                                </ListItemIcon>
                                <ListItemText primaryTypographyProps={{ variant: "body2", color: "text.secondary", fontWeight: 500 }}>
                                    Edit
                                </ListItemText>
                            </MenuItem>
                            {showMakeFeatured && (
                                <MenuItem
                                    onClick={() => {
                                        handleClose();
                                        if (onMakeFeatured) onMakeFeatured();
                                    }}
                                >
                                    <ListItemIcon>
                                        <IconStar size={18} color={theme.palette.text.secondary} />
                                    </ListItemIcon>
                                    <ListItemText primaryTypographyProps={{ variant: "body2", color: "text.secondary", fontWeight: 500 }}>
                                        Make Featured
                                    </ListItemText>
                                </MenuItem>
                            )}
                        </Menu>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}
