import { Head, Link, usePage, router } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Grid,
    Breadcrumbs,
    Button,
    Stack,
    Tabs,
    Tab,
    Paper,
    Divider,
    List,
    ListItem,
    ListItemText,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    ThemeProvider,
    CssBaseline,
    createTheme,
} from "@mui/material";
import {
    IconChevronRight,
    IconCalendarEvent,
    IconMapPin,
    IconClock,
} from "@tabler/icons-react";
import { useState } from "react";
import { format } from "date-fns";
import FooterSection from "@/components/sections/landing/FooterSection";
import PublicNavbar from "@/components/common/PublicNavbar";

// Custom theme (consistent with listing page but with specific overrides)
const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#3B82F6", // Blue for links/highlights
        },
        success: {
            main: "#4ADE80", // Bright green for JOIN button
            dark: "#22C55E",
            contrastText: "#FFFFFF",
        },
        text: {
            primary: "#1F2937",
            secondary: "#6B7280",
        },
        background: {
            default: "#FFFFFF",
            paper: "#FFFFFF",
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h3: {
            fontSize: "2rem",
            fontWeight: 400, // Light/Regular weight as per screenshot
            color: "#374151",
        },
        overline: {
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#4ADE80", // Green labels
            letterSpacing: "1px",
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: "100px", // Pill shape
                    textTransform: "uppercase",
                    fontWeight: 700,
                    padding: "10px 32px",
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: "#374151",
                    "&.Mui-selected": {
                        color: "#374151", // Keep dark color when selected
                    },
                },
            },
        },
    },
});

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

export default function EventDetail({ event, isRegistered = false, archives = [], about = "" }) {
    const { auth } = usePage().props;
    const [tabValue, setTabValue] = useState(1); // Default to 'Event Target' (index 1)

    const handleChangeTab = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleJoin = () => {
        router.post(`/events/${event.slug}/join/`);
    };

    const handleArchiveChange = (e) => {
        const month = e.target.value;
        if (month) {
            router.visit(`/events/?month=${month}`);
        }
    };

    // Platform mock for footer
    const platform = { institutionName: "Crossview" };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Head title={`${event.title} - Events`} />

            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Navbar */}
                <PublicNavbar activeLink="/events/" auth={auth} />

                {/* Header / Breadcrumbs */}
                <Box sx={{ pt: 12, pb: 2, bgcolor: "#FFFFFF" }}>
                    <Container maxWidth="lg">
                        <Breadcrumbs
                            separator={<IconChevronRight size={14} />}
                            aria-label="breadcrumb"
                            sx={{
                                fontSize: "0.75rem",
                                textTransform: "uppercase",
                                color: "#9CA3AF",
                            }}
                        >
                            <Link
                                href="/"
                                style={{
                                    textDecoration: "none",
                                    color: "inherit",
                                }}
                            >
                                Home
                            </Link>
                            <Link
                                href="/events/"
                                style={{
                                    textDecoration: "none",
                                    color: "inherit",
                                }}
                            >
                                Events
                            </Link>
                            <Typography
                                color="text.disabled"
                                sx={{ fontSize: "0.75rem" }}
                            >
                                {event.title}
                            </Typography>
                        </Breadcrumbs>
                    </Container>
                </Box>

                <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
                    {/* Event Title */}
                    <Typography variant="h3" gutterBottom sx={{ mb: 4 }}>
                        {event.title}
                    </Typography>

                    <Grid container spacing={6}>
                        {/* Main Content Column (Left/Center) */}
                        <Grid size={{ xs: 12, md: 8 }}>
                            {/* Featured Image */}
                            <Box
                                component="img"
                                src={
                                    event.image ||
                                    "/static/images/course-placeholder.jpg"
                                }
                                alt={event.title}
                                sx={{
                                    width: "100%",
                                    height: "auto",
                                    maxHeight: 400,
                                    objectFit: "cover",
                                    mb: 4,
                                }}
                            />

                            {/* Info Bar Box */}
                            <Paper
                                elevation={0}
                                variant="outlined"
                                sx={{
                                    p: 3,
                                    mb: 6,
                                    border: "1px solid #E5E7EB",
                                    borderRadius: 0,
                                }}
                            >
                                <Grid container alignItems="center" spacing={3}>
                                    <Grid size={{ xs: 6, sm: 3 }}>
                                        <Typography
                                            variant="overline"
                                            display="block"
                                        >
                                            START:
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {format(
                                                new Date(event.start_date),
                                                "MMMM d, yyyy h:mm a",
                                            )}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6, sm: 3 }}>
                                        <Typography
                                            variant="overline"
                                            display="block"
                                        >
                                            END:
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {format(
                                                new Date(event.end_date),
                                                "MMMM d, yyyy h:mm a",
                                            )}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 3 }}>
                                        <Typography
                                            variant="overline"
                                            display="block"
                                        >
                                            LOCATION:
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {event.location}
                                        </Typography>
                                    </Grid>
                                    <Grid
                                        size={{ xs: 12, sm: 3 }}
                                        sx={{
                                            textAlign: {
                                                xs: "left",
                                                sm: "right",
                                            },
                                        }}
                                    >
                                        <Button
                                            variant="contained"
                                            color={
                                                isRegistered
                                                    ? "primary"
                                                    : "success"
                                            }
                                            disableElevation
                                            sx={{ color: "white" }}
                                            onClick={handleJoin}
                                            disabled={isRegistered}
                                        >
                                            {isRegistered
                                                ? "REGISTERED"
                                                : "JOIN!"}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Description */}
                            <Box
                                sx={{ mb: 6 }}
                                dangerouslySetInnerHTML={{
                                    __html: event.description,
                                }}
                            />

                            {/* Tabs */}
                            <Box
                                sx={{ borderBottom: 1, borderColor: "divider" }}
                            >
                                <Tabs
                                    value={tabValue}
                                    onChange={handleChangeTab}
                                    aria-label="event tabs"
                                    TabIndicatorProps={{
                                        style: {
                                            height: "100%",
                                            zIndex: -1,
                                            borderTop: "2px solid #3B82F6", // Active tab top border blue
                                            borderLeft: "1px solid #E5E7EB",
                                            borderRight: "1px solid #E5E7EB",
                                            backgroundColor: "white",
                                            top: -1,
                                        },
                                    }}
                                    sx={{
                                        "& .MuiTab-root": {
                                            borderTop: "2px solid transparent",
                                            px: 4,
                                            py: 2,
                                        },
                                        "& .Mui-selected": {
                                            borderTop: "2px solid #3B82F6",
                                            borderLeft: "1px solid #E5E7EB",
                                            borderRight: "1px solid #E5E7EB",
                                        },
                                    }}
                                >
                                    <Tab label="Location" />
                                    <Tab label="Event Target" />
                                </Tabs>
                            </Box>

                            <TabPanel value={tabValue} index={0}>
                                <Box
                                    sx={{
                                        p: 4,
                                        border: "1px solid #E5E7EB",
                                        mt: -0.1,
                                        borderTop: 0,
                                    }}
                                >
                                    <Typography variant="h6" gutterBottom>
                                        Venue Location
                                    </Typography>
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                        sx={{ mb: 3 }}
                                    >
                                        <IconMapPin size={20} />
                                        <Typography>
                                            {event.location}
                                        </Typography>
                                    </Stack>
                                    
                                    {/* Map Embed or Placeholder */}
                                    {event.map_embed_code ? (
                                        <Box
                                            sx={{
                                                height: 400,
                                                bgcolor: "#F3F4F6",
                                                overflow: "hidden",
                                                borderRadius: 1,
                                                "& iframe": { 
                                                    width: "100%", 
                                                    height: "100%", 
                                                    border: 0 
                                                }
                                            }}
                                            dangerouslySetInnerHTML={{ __html: event.map_embed_code }}
                                        />
                                    ) : (
                                        <Box
                                            sx={{
                                                height: 200,
                                                bgcolor: "#F3F4F6",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                borderRadius: 1,
                                            }}
                                        >
                                            <Typography color="text.secondary">
                                                No map available for {event.location}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </TabPanel>

                            <TabPanel value={tabValue} index={1}>
                                <Box
                                    sx={{
                                        p: 4,
                                        border: "1px solid #E5E7EB",
                                        mt: -0.1,
                                        borderTop: 0,
                                    }}
                                >
                                    <Typography
                                        paragraph
                                        color="text.secondary"
                                    >
                                        {event.tab_content?.event_target ||
                                            "Event details..."}
                                    </Typography>

                                    {event.what_you_learn && (
                                        <>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    mt: 4,
                                                    mb: 2,
                                                    fontSize: "1rem",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                What's new:
                                            </Typography>
                                            <Grid container>
                                                {event.what_you_learn.map(
                                                    (item, idx) => (
                                                        <Grid
                                                            size={{
                                                                xs: 12,
                                                                sm: 6,
                                                            }}
                                                            key={idx}
                                                        >
                                                            <ListItem
                                                                sx={{
                                                                    pl: 0,
                                                                    py: 0.5,
                                                                }}
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        width: 4,
                                                                        height: 4,
                                                                        bgcolor:
                                                                            "text.primary",
                                                                        borderRadius:
                                                                            "50%",
                                                                        mr: 2,
                                                                        display:
                                                                            "inline-block",
                                                                    }}
                                                                />
                                                                <ListItemText
                                                                    primary={
                                                                        item
                                                                    }
                                                                    primaryTypographyProps={{
                                                                        variant:
                                                                            "body2",
                                                                        color: "text.secondary",
                                                                    }}
                                                                />
                                                            </ListItem>
                                                        </Grid>
                                                    ),
                                                )}
                                            </Grid>
                                        </>
                                    )}
                                </Box>
                            </TabPanel>
                        </Grid>

                        {/* Sidebar Column (Right) */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Stack spacing={4}>
                                {/* Archive Widget */}
                                {archives && archives.length > 0 && (
                                    <Box>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                mb: 2,
                                                fontWeight: 400,
                                                textTransform: "uppercase",
                                                fontSize: "1.1rem",
                                            }}
                                        >
                                            Archive
                                        </Typography>
                                        <FormControl fullWidth size="small">
                                            <Select
                                                value=""
                                                displayEmpty
                                                onChange={handleArchiveChange}
                                                inputProps={{
                                                    "aria-label": "Select Month",
                                                }}
                                                sx={{ borderRadius: 0 }}
                                            >
                                                <MenuItem value="">
                                                    <Typography color="text.secondary">
                                                        Select Month
                                                    </Typography>
                                                </MenuItem>
                                                {archives.map((arch) => (
                                                    <MenuItem key={arch.value} value={arch.value}>
                                                        {arch.label} ({arch.count})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                )}

                                {/* Divider */}
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 3,
                                        bgcolor: "#3B82F6",
                                    }}
                                />

                                {/* About Us Widget */}
                                {about && (
                                    <Box>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                mb: 2,
                                                fontWeight: 400,
                                                textTransform: "uppercase",
                                                fontSize: "1.1rem",
                                            }}
                                        >
                                            About Us:
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mb: 2, lineHeight: 1.7 }}
                                        >
                                            {about}
                                        </Typography>
                                    </Box>
                                )}

                                {/* Divider */}
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 3,
                                        bgcolor: "#3B82F6",
                                    }}
                                />
                            </Stack>
                        </Grid>
                    </Grid>
                </Container>

                <FooterSection platform={platform} />
            </Box>
        </ThemeProvider>
    );
}
