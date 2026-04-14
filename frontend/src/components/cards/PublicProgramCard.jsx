/**
 * PublicProgramCard - Reusable program card for public pages
 * Used on landing page and programs listing page
 *
 * CTA Strategy:
 *   Listing cards → "Preview This Course" (navigates to detail page)
 *   Detail page  → "Buy Now" (adds to cart + redirects to /checkout/)
 *
 * This keeps the listing page clean and funnels users through:
 *   Browse → Preview → Buy → Pay
 */

import { useState, useEffect } from "react";
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
    Button,
    IconButton,
    useTheme,
} from "@mui/material";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";

// ---------------------------------------------------------------------------
// Wishlist helpers (localStorage-only, no backend persistence)
// ---------------------------------------------------------------------------

const WISHLIST_KEY = "wishlist_programs";

function getWishlist() {
    try {
        return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
    } catch {
        return [];
    }
}

function toggleWishlistItem(programId) {
    const list = getWishlist();
    const idx = list.indexOf(programId);
    if (idx === -1) {
        list.push(programId);
    } else {
        list.splice(idx, 1);
    }
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    return list;
}

function isInWishlist(programId) {
    return getWishlist().includes(programId);
}

// ---------------------------------------------------------------------------
// Badge colors
// ---------------------------------------------------------------------------

function getBadgeColor(type) {
    switch (type) {
        case "featured":
        case "special":
            return "#F59E0B";
        case "new":
            return "#10B981";
        case "popular":
        case "hot":
            return "#EF4444";
        case "bestseller":
            return "#8B5CF6";
        default:
            return "#6B7280";
    }
}


export default function PublicProgramCard({
    program,
    enrollmentStatus = null,
    showEnrollButton = false,
}) {
    const theme = useTheme();
    const [wishlisted, setWishlisted] = useState(false);

    useEffect(() => {
        setWishlisted(isInWishlist(program.id));
    }, [program.id]);

    const handleWishlistToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlistItem(program.id);
        setWishlisted((prev) => !prev);
    };

    return (
        <Card
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                overflow: "hidden",
                bgcolor: "#FFFFFF",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 24px -4px rgba(0,0,0,0.15)",
                },
            }}
        >
            {/* Thumbnail with badge + wishlist heart */}
            <Box sx={{ position: "relative" }}>
                <CardMedia
                    component="img"
                    image={
                        program.thumbnail ||
                        "/static/images/course-placeholder.svg"
                    }
                    alt={program.name}
                    sx={{ aspectRatio: "16/9", objectFit: "cover" }}
                />
                {program.badge_type && (
                    <Chip
                        label={
                            program.badge_type.charAt(0).toUpperCase() +
                            program.badge_type.slice(1)
                        }
                        size="small"
                        sx={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            bgcolor: getBadgeColor(program.badge_type),
                            color: "white",
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            height: 24,
                        }}
                    />
                )}

                {/* Wishlist heart icon */}
                <IconButton
                    onClick={handleWishlistToggle}
                    size="small"
                    aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    sx={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        bgcolor: "rgba(255,255,255,0.85)",
                        backdropFilter: "blur(4px)",
                        "&:hover": {
                            bgcolor: "rgba(255,255,255,0.95)",
                            transform: "scale(1.1)",
                        },
                        transition: "all 0.2s ease",
                        width: 32,
                        height: 32,
                    }}
                >
                    {wishlisted ? (
                        <IconHeartFilled size={18} color={theme.palette.error.main} />
                    ) : (
                        <IconHeart size={18} color="#6B7280" />
                    )}
                </IconButton>
            </Box>

            <CardContent
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    p: 2.5,
                }}
            >
                {/* Category */}
                {program.category && (
                    <Typography
                        variant="caption"
                        sx={{ mb: 0.5, color: "#6B7280" }}
                    >
                        {program.category}
                    </Typography>
                )}

                {/* Title */}
                <Typography
                    component={Link}
                    href={`/programs/${program.id}/`}
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{
                        mb: 0.5,
                        textDecoration: "none",
                        color: "#1F2937",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        "&:hover": { color: theme.palette.primary.main },
                    }}
                >
                    {program.name}
                </Typography>

                {/* Description (short) */}
                {program.description && (
                    <Typography
                        variant="body2"
                        sx={{
                            mb: 1.5,
                            color: "#6B7280",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        {program.description}
                    </Typography>
                )}

                {/* Rating & Price Row */}
                <Box sx={{ mt: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {/* Rating */}
                    <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                    >
                        <Rating
                            value={program.rating || 0}
                            precision={0.1}
                            size="small"
                            readOnly
                        />
                        <Typography variant="caption" sx={{ color: "#6B7280" }}>
                            {program.rating?.toFixed(1) || "0.0"}
                        </Typography>
                    </Stack>

                    {/* Price */}
                    <Box>
                        {program.price > 0 ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography
                                    variant="body1"
                                    fontWeight={700}
                                    color="primary.main"
                                >
                                    ${program.price}
                                </Typography>
                                {program.original_price &&
                                    program.original_price > program.price && (
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                textDecoration: "line-through",
                                                color: "#9CA3AF",
                                            }}
                                        >
                                            ${program.original_price}
                                        </Typography>
                                    )}
                            </Stack>
                        ) : (
                            <Typography
                                variant="body1"
                                fontWeight={700}
                                color="success.main"
                            >
                                Free
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Action Button */}
                {showEnrollButton && (
                    <Box sx={{ mt: 2 }}>
                        {enrollmentStatus === "enrolled" ? (
                            <Button
                                component={Link}
                                href={`/programs/${program.id}/`}
                                variant="contained"
                                color="success"
                                fullWidth
                                size="small"
                            >
                                Continue Learning
                            </Button>
                        ) : enrollmentStatus === "pending" ? (
                            <Button
                                variant="outlined"
                                fullWidth
                                size="small"
                                disabled
                            >
                                Enrollment Pending
                            </Button>
                        ) : (
                            <Button
                                component={Link}
                                href={`/programs/${program.id}/`}
                                variant="contained"
                                fullWidth
                                size="small"
                            >
                                Preview This Course
                            </Button>
                        )}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
