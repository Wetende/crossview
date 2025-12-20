import { Link } from "@inertiajs/react";
import { Breadcrumbs as MuiBreadcrumbs, Typography, Box } from "@mui/material";
import { IconChevronRight, IconHome } from "@tabler/icons-react";

/**
 * Breadcrumbs - Navigation path based on current route
 *
 * @param {Array} items - Array of { label, href } objects
 */
export default function Breadcrumbs({ items = [] }) {
    if (items.length === 0) return null;

    return (
        <Box sx={{ mb: 2 }}>
            <MuiBreadcrumbs
                separator={<IconChevronRight size={16} />}
                aria-label="breadcrumb"
            >
                <Link
                    href="/dashboard"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        color: "inherit",
                        textDecoration: "none",
                    }}
                >
                    <IconHome size={18} />
                </Link>

                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    if (isLast) {
                        return (
                            <Typography
                                key={index}
                                variant="body2"
                                color="text.primary"
                                fontWeight={500}
                            >
                                {item.label}
                            </Typography>
                        );
                    }

                    return (
                        <Link
                            key={index}
                            href={item.href}
                            style={{
                                color: "inherit",
                                textDecoration: "none",
                            }}
                        >
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    "&:hover": {
                                        color: "primary.main",
                                        textDecoration: "underline",
                                    },
                                }}
                            >
                                {item.label}
                            </Typography>
                        </Link>
                    );
                })}
            </MuiBreadcrumbs>
        </Box>
    );
}

/**
 * Generate breadcrumb items from a path string
 */
export function generateBreadcrumbs(pathname, labels = {}) {
    const segments = pathname.split("/").filter(Boolean);

    return segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const label =
            labels[segment] ||
            segment.charAt(0).toUpperCase() + segment.slice(1);

        return { label, href };
    });
}
