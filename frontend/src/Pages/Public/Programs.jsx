import { Head, Link, router } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Grid,
    Stack,
    Card,
    CardContent,
    useTheme,
    Button,
    AppBar,
    Toolbar,
    useScrollTrigger,
    TextField,
    InputAdornment,
    Chip,
} from "@mui/material";
import {
    IconBrandTabler,
    IconSearch,
    IconBook,
    IconCalendar,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { getBackgroundDots } from "../../utils/getBackgroundDots";
import { cloneElement, useState } from "react";
import ButtonAnimationWrapper from "../../components/common/ButtonAnimationWrapper";
import { format } from "date-fns";

// --- Helper Components ---
function ElevationScroll({ children }) {
    const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 0 });
    return cloneElement(children, {
        elevation: trigger ? 4 : 0,
        sx: {
            bgcolor: trigger ? "rgba(255, 255, 255, 0.9)" : "transparent",
            backdropFilter: trigger ? "blur(20px)" : "none",
            borderBottom: trigger ? 1 : 0,
            borderColor: "divider",
            transition: "all 0.3s ease",
            py: trigger ? 1 : 2,
        },
    });
}

function GraphicsCard({ children, sx = {} }) {
    return (
        <Card
            sx={{
                borderRadius: { xs: 4, sm: 6 }, // Slightly smaller radius for program cards
                border: "1px solid",
                borderColor: "grey.200",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                overflow: "hidden",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 24px -4px rgba(0,0,0,0.1)",
                    borderColor: "primary.light",
                },
                ...sx,
            }}
        >
            {children}
        </Card>
    );
}

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

export default function Programs({ programs, filters }) {
    const theme = useTheme();
    const [search, setSearch] = useState(filters.search || "");

    const handleSearch = (e) => {
        e.preventDefault();
        router.get("/programs/", { search }, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Academic Programs - Crossview LMS" />

            <Box sx={{ minHeight: "100vh", bgcolor: "background.default", overflowX: "hidden" }}>
                {/* Navbar */}
                <ElevationScroll>
                    <AppBar position="fixed" color="transparent" sx={{ py: 2 }}>
                        <Container maxWidth="lg">
                            <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Box
                                        component={Link}
                                        href="/"
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            bgcolor: "primary.main",
                                            borderRadius: 2,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "white",
                                            textDecoration: "none"
                                        }}
                                    >
                                        <IconBrandTabler size={24} />
                                    </Box>
                                    <Typography
                                        component={Link}
                                        href="/"
                                        variant="h5"
                                        fontWeight={700}
                                        sx={{ color: "grey.900", textDecoration: "none" }}
                                    >
                                        Crossview
                                    </Typography>
                                </Stack>

                                <Stack direction="row" spacing={3} sx={{ display: { xs: "none", md: "flex" } }}>
                                    <Link href="/programs/" style={{ textDecoration: 'none', color: theme.palette.primary.main, fontWeight: 600 }}>Programs</Link>
                                    <Link href="/about/" style={{ textDecoration: 'none', color: theme.palette.text.primary, fontWeight: 500 }}>About</Link>
                                    <Link href="/contact/" style={{ textDecoration: 'none', color: theme.palette.text.primary, fontWeight: 500 }}>Contact</Link>
                                </Stack>

                                <Stack direction="row" spacing={2}>
                                    <Button component={Link} href="/login/" color="inherit" sx={{ fontWeight: 600 }}>
                                        Sign In
                                    </Button>
                                    <ButtonAnimationWrapper>
                                        <Button component={Link} href="/register/" variant="contained" sx={{ borderRadius: 100, px: 3 }}>
                                            Get Started
                                        </Button>
                                    </ButtonAnimationWrapper>
                                </Stack>
                            </Toolbar>
                        </Container>
                    </AppBar>
                </ElevationScroll>

                {/* Hero Section */}
                <Box sx={{ position: "relative", pt: { xs: 16, md: 24 }, pb: { xs: 8, md: 12 } }}>
                    <Box
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: getBackgroundDots(theme.palette.grey[300], 2, 30),
                            zIndex: -1,
                            maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
                        }}
                    />
                    <Container maxWidth="lg">
                        <motion.div {...fadeInUp}>
                            <Typography variant="h1" gutterBottom>
                                Academic Programs
                            </Typography>
                            <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 600, mb: 6, fontWeight: 400 }}>
                                Explore our diverse range of programs designed to equip you with the skills for the future.
                            </Typography>

                            {/* Search Bar */}
                            <Box component="form" onSubmit={handleSearch} sx={{ maxWidth: 500 }}>
                                <TextField
                                    fullWidth
                                    placeholder="Search programs..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <IconSearch size={20} color={theme.palette.text.secondary} />
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            bgcolor: "background.paper",
                                            borderRadius: 100,
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                            "& fieldset": { border: "1px solid", borderColor: "grey.200" },
                                            "&:hover fieldset": { borderColor: "primary.main" },
                                        }
                                    }}
                                />
                            </Box>
                        </motion.div>
                    </Container>
                </Box>

                {/* Programs Grid */}
                <Container maxWidth="lg" sx={{ pb: 16 }}>
                    {programs.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 10 }}>
                            <IconBook size={48} color={theme.palette.grey[400]} />
                            <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                                No programs found matching your search.
                            </Typography>
                            {search && (
                                <Button onClick={() => { setSearch(""); router.get("/programs/"); }} sx={{ mt: 2 }}>
                                    Clear Search
                                </Button>
                            )}
                        </Box>
                    ) : (
                        <Grid container spacing={4}>
                            {programs.map((program, idx) => (
                                <Grid item xs={12} md={6} lg={4} key={program.id}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05, duration: 0.5 }}
                                    >
                                        <GraphicsCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                                            <CardContent sx={{ p: 4, flexGrow: 1 }}>
                                                <Box sx={{ mb: 2 }}>
                                                    <Chip 
                                                        label={program.code || "PROGRAM"} 
                                                        size="small" 
                                                        sx={{ bgcolor: "primary.lighter", color: "primary.main", fontWeight: 700, borderRadius: 1 }} 
                                                    />
                                                </Box>
                                                <Typography variant="h5" fontWeight={700} gutterBottom>
                                                    {program.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {program.description || "No description available."}
                                                </Typography>
                                                
                                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: "auto", color: "text.secondary" }}>
                                                    <IconCalendar size={16} />
                                                    <Typography variant="caption">
                                                        Added {format(new Date(program.created_at), "MMM d, yyyy")}
                                                    </Typography>
                                                </Stack>
                                            </CardContent>
                                            <Box sx={{ p: 3, pt: 0 }}>
                                                <ButtonAnimationWrapper className="w-full">
                                                    <Button 
                                                        variant="outlined" 
                                                        fullWidth 
                                                        sx={{ borderRadius: 100 }}
                                                        component={Link}
                                                        href={`/register/?program=${program.id}`}
                                                    >
                                                        Apply Now
                                                    </Button>
                                                </ButtonAnimationWrapper>
                                            </Box>
                                        </GraphicsCard>
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Container>

                {/* Footer (Consistent) */}
                <Box sx={{ bgcolor: "grey.900", color: "grey.400", py: 8 }}>
                    <Container maxWidth="lg">
                        <Grid container spacing={8}>
                            <Grid item xs={12} md={4}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, color: "white" }}>
                                    <IconBrandTabler size={32} />
                                    <Typography variant="h5" fontWeight={700}>Crossview</Typography>
                                </Stack>
                                <Typography variant="body2" sx={{ maxWidth: 300 }}>
                                    Empowering Kenyan institutions with modern, flexible, and reliable educational technology.
                                </Typography>
                            </Grid>
                            <Grid item xs={6} md={2}>
                                <Typography variant="subtitle2" color="white" gutterBottom>Platform</Typography>
                                <Stack spacing={1}>
                                    <Link href="/programs/" style={{ color: "inherit", textDecoration: "none" }}>Programs</Link>
                                    <Link href="/about/" style={{ color: "inherit", textDecoration: "none" }}>About</Link>
                                </Stack>
                            </Grid>
                             <Grid item xs={6} md={2}>
                                <Typography variant="subtitle2" color="white" gutterBottom>Support</Typography>
                                <Stack spacing={1}>
                                    <Link href="/contact/" style={{ color: "inherit", textDecoration: "none" }}>Contact</Link>
                                    <Link href="/verify-certificate/" style={{ color: "inherit", textDecoration: "none" }}>Verify Certificate</Link>
                                </Stack>
                            </Grid>
                        </Grid>
                        <Box sx={{ mt: 8, pt: 4, borderTop: 1, borderColor: "grey.800", textAlign: "center" }}>
                            <Typography variant="caption">© 2025 Crossview LMS. All rights reserved.</Typography>
                        </Box>
                    </Container>
                </Box>
            </Box>
        </>
    );
}
