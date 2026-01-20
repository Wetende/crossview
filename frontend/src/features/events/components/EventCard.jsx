import {
    Box,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Stack,
    Divider,
    useTheme,
} from "@mui/material";
import { IconClock, IconMapPin } from "@tabler/icons-react";
import { Link } from "@inertiajs/react";
import { format } from "date-fns";

export default function EventCard({ event }) {
    const theme = useTheme();

    // Format dates for display
    const startDate = new Date(event.start_date);
    const dateStr = format(startDate, "MMMM d, yyyy");

    return (
        <Card
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 0, // Design shows sharp or minimal radius
                border: "none",
                boxShadow: "none",
                bgcolor: "background.paper",
                "&:hover": {
                    "& .event-title": {
                        color: theme.palette.primary.main,
                    },
                    "& .event-divider": {
                        width: "100%",
                    },
                },
            }}
        >
            {/* Image */}
            <Box
                component={Link}
                href={`/events/${event.slug}/`}
                sx={{
                    position: "relative",
                    overflow: "hidden",
                    display: "block",
                }}
            >
                <CardMedia
                    component="img"
                    height="200"
                    image={event.image || "/static/images/course-placeholder.jpg"}
                    alt={event.title}
                    sx={{
                        objectFit: "cover",
                        transition: "transform 0.3s ease",
                        "&:hover": {
                            transform: "scale(1.05)",
                        },
                    }}
                />
            </Box>

            <CardContent
                sx={{
                    flexGrow: 1,
                    px: 0,
                    pt: 2,
                    pb: 1,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Title */}
                <Typography
                    className="event-title"
                    component={Link}
                    href={`/events/${event.slug}/`}
                    variant="h6"
                    sx={{
                        mb: 2,
                        fontWeight: 500,
                        fontSize: "1.1rem",
                        lineHeight: 1.4,
                        textDecoration: "none",
                        color: "text.primary",
                        transition: "color 0.2s ease",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                    }}
                >
                    {event.title}
                </Typography>

                {/* Metadata Row */}
                <Stack spacing={1.5}>
                    {/* Date */}
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <IconClock size={18} color={theme.palette.success.light} />
                        <Typography variant="body2" color="text.secondary">
                            {dateStr}
                        </Typography>
                    </Stack>

                    {/* Location */}
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <IconMapPin
                            size={18}
                            color={theme.palette.success.light}
                            style={{ minWidth: 18 }} // Prevent shrink
                        />
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}
                        >
                            {event.location}
                        </Typography>
                    </Stack>
                </Stack>

                {/* Animated Divider */}
                <Box
                    className="event-divider"
                    sx={{
                        mt: 2.5,
                        width: "40px",
                        height: "2px",
                        bgcolor: "primary.main",
                        transition: "width 0.3s ease",
                    }}
                />
            </CardContent>
        </Card>
    );
}
