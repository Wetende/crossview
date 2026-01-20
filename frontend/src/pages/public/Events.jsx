import { Head, Link } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Grid,
    Breadcrumbs,
    ThemeProvider,
    CssBaseline,
    createTheme,
} from "@mui/material";
import { IconChevronRight } from "@tabler/icons-react";
import EventCard from "@/features/events/components/EventCard";
import FooterSection from "@/components/sections/landing/FooterSection"; // Reusing footer

// Light theme to match landing page style
const lightTheme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#3B82F6",
        },
        success: {
            main: "#10B981",
            light: "#34D399",
        },
        background: {
            default: "#FFFFFF",
            paper: "#FFFFFF",
        },
        text: {
            primary: "#1F2937",
            secondary: "#6B7280",
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
});

export default function Events({ events }) {
    // Mock platform data for footer since we might not pass it from mock view
    const platform = {
        institutionName: "MasterStudy",
        description: "Review tems for online education.",
    };

    return (
        <ThemeProvider theme={lightTheme}>
            <CssBaseline />
            <Head title="Events - Crossview" />

            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "white",
                }}
            >
                {/* Header Section */}
                <Box
                    sx={{
                        py: 4,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        bgcolor: "#F9FAFB",
                    }}
                >
                    <Container maxWidth="lg">
                        <Breadcrumbs
                            separator={<IconChevronRight size={16} />}
                            aria-label="breadcrumb"
                            sx={{ mb: 2, fontSize: "0.875rem" }}
                        >
                            <Link
                                href="/"
                                style={{
                                    textDecoration: "none",
                                    color: "#6B7280",
                                }}
                            >
                                Home
                            </Link>
                            <Typography color="text.primary">Events</Typography>
                        </Breadcrumbs>
                    </Container>
                </Box>

                {/* Create a separate wrapper for content to manage spacing */}
                <Container maxWidth="lg" sx={{ py: 8, flexGrow: 1 }}>
                    {/* Events Grid */}
                    <Grid container spacing={4}>
                        {events.map((event) => (
                            <Grid item xs={12} sm={6} md={3} key={event.id}>
                                <EventCard event={event} />
                            </Grid>
                        ))}
                    </Grid>
                </Container>

                {/* Reuse Footer from Landing Page */}
                <FooterSection platform={platform} />
            </Box>
        </ThemeProvider>
    );
}
