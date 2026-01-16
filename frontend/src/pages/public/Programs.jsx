import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Grid,
    Stack,
    Card,
    CardContent,
    CardMedia,
    useTheme,
    Button,
    AppBar,
    Toolbar,
    useScrollTrigger,
    TextField,
    InputAdornment,
    Chip,
    Rating,
    FormControl,
    Select,
    MenuItem,
} from "@mui/material";
import {
    IconBrandTabler,
    IconSearch,
    IconBook,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { getBackgroundDots } from "../../utils/getBackgroundDots";
import { cloneElement, useState } from "react";
import ButtonAnimationWrapper from "../../components/common/ButtonAnimationWrapper";

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

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

// Badge colors
const getBadgeColor = (type) => {
    switch (type) {
        case 'hot': return '#FF4444';
        case 'new': return '#4CAF50';
        case 'special': return '#FF9800';
        default: return '#1976d2';
    }
};

// Program Card Component
function ProgramCard({ program, enrollmentStatus, isAuthenticated }) {
    const theme = useTheme();
    
    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px -4px rgba(0,0,0,0.15)',
                },
            }}
        >
            {/* Thumbnail with badge */}
            <Box sx={{ position: 'relative' }}>
                <CardMedia
                    component="img"
                    height="160"
                    image={program.thumbnail || '/static/images/course-placeholder.jpg'}
                    alt={program.name}
                    sx={{ objectFit: 'cover' }}
                />
                {program.badge_type && (
                    <Chip
                        label={program.badge_type.charAt(0).toUpperCase() + program.badge_type.slice(1)}
                        size="small"
                        sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            bgcolor: getBadgeColor(program.badge_type),
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            height: 24,
                        }}
                    />
                )}
            </Box>

            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
                {/* Category */}
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                    {program.category || 'General'}
                </Typography>

                {/* Title */}
                <Typography
                    component={Link}
                    href={`/programs/${program.id}/`}
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{
                        mb: 1,
                        textDecoration: 'none',
                        color: 'text.primary',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        '&:hover': { color: 'primary.main' },
                    }}
                >
                    {program.name}
                </Typography>

                {/* Rating */}
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <Rating value={program.rating || 0} precision={0.1} size="small" readOnly />
                    <Typography variant="caption" color="text.secondary">
                        {program.rating?.toFixed(1) || '0.0'}
                    </Typography>
                </Stack>

                {/* Price */}
                <Box sx={{ mt: 'auto' }}>
                    {program.price > 0 ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body1" fontWeight={700} color="primary.main">
                                ${program.price}
                            </Typography>
                            {program.original_price && program.original_price > program.price && (
                                <Typography
                                    variant="body2"
                                    sx={{ textDecoration: 'line-through', color: 'text.disabled' }}
                                >
                                    ${program.original_price}
                                </Typography>
                            )}
                        </Stack>
                    ) : (
                        <Typography variant="body1" fontWeight={700} color="success.main">
                            Free
                        </Typography>
                    )}
                </Box>

                {/* Action Button */}
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
                        <Button variant="outlined" fullWidth size="small" disabled>
                            Enrollment Pending
                        </Button>
                    ) : (
                        <Button
                            component={Link}
                            href={`/programs/${program.id}/`}
                            variant="contained"
                            fullWidth
                            size="small"
                            sx={{ bgcolor: isAuthenticated ? 'primary.main' : 'primary.main' }}
                        >
                            {isAuthenticated ? 'Enroll Now' : 'View Details'}
                        </Button>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}

export default function Programs({ 
    programs, 
    filters, 
    categories = [],
    userEnrollments = [], 
    userPendingRequests = [] 
}) {
    const theme = useTheme();
    const { auth } = usePage().props;
    const [search, setSearch] = useState(filters.search || "");
    const [selectedCategory, setSelectedCategory] = useState(filters.category || "");

    const getEnrollmentStatus = (programId) => {
        if (userEnrollments.includes(programId)) return "enrolled";
        if (userPendingRequests.includes(programId)) return "pending";
        return null;
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (selectedCategory) params.set("category", selectedCategory);
        router.get(`/programs/?${params.toString()}`, {}, { preserveState: true, replace: true });
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (category) params.set("category", category);
        router.get(`/programs/?${params.toString()}`, {}, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Academic Programs - Crossview LMS" />

            <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa", overflowX: "hidden" }}>
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
                                    {auth?.user ? (
                                        <Button component={Link} href="/dashboard/" variant="contained" sx={{ borderRadius: 100, px: 3 }}>
                                            Dashboard
                                        </Button>
                                    ) : (
                                        <>
                                            <Button component={Link} href="/login/" color="inherit" sx={{ fontWeight: 600 }}>
                                                Sign In
                                            </Button>
                                            <ButtonAnimationWrapper>
                                                <Button component={Link} href="/register/" variant="contained" sx={{ borderRadius: 100, px: 3 }}>
                                                    Get Started
                                                </Button>
                                            </ButtonAnimationWrapper>
                                        </>
                                    )}
                                </Stack>
                            </Toolbar>
                        </Container>
                    </AppBar>
                </ElevationScroll>

                {/* Hero Section */}
                <Box sx={{ position: "relative", pt: { xs: 16, md: 20 }, pb: { xs: 4, md: 6 } }}>
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
                            <Typography variant="h3" fontWeight={700} gutterBottom>
                                Explore Courses
                            </Typography>
                            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mb: 4, fontWeight: 400 }}>
                                Discover our diverse range of programs designed to equip you with skills for the future.
                            </Typography>

                            {/* Search & Filter Row */}
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ maxWidth: 700 }}>
                                <Box component="form" onSubmit={handleSearch} sx={{ flex: 1 }}>
                                    <TextField
                                        fullWidth
                                        placeholder="Search courses..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        size="small"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <IconSearch size={20} color={theme.palette.text.secondary} />
                                                </InputAdornment>
                                            ),
                                            sx: {
                                                bgcolor: "background.paper",
                                                borderRadius: 2,
                                            }
                                        }}
                                    />
                                </Box>
                                {categories.length > 0 && (
                                    <FormControl size="small" sx={{ minWidth: 150 }}>
                                        <Select
                                            displayEmpty
                                            value={selectedCategory}
                                            onChange={(e) => handleCategoryChange(e.target.value)}
                                            sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
                                        >
                                            <MenuItem value="">All Categories</MenuItem>
                                            {categories.map((cat) => (
                                                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            </Stack>
                        </motion.div>
                    </Container>
                </Box>

                {/* Programs Grid */}
                <Container maxWidth="lg" sx={{ pb: 12 }}>
                    {programs.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 10 }}>
                            <IconBook size={48} color={theme.palette.grey[400]} />
                            <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                                No programs found matching your search.
                            </Typography>
                            {(search || selectedCategory) && (
                                <Button 
                                    onClick={() => { 
                                        setSearch(""); 
                                        setSelectedCategory("");
                                        router.get("/programs/"); 
                                    }} 
                                    sx={{ mt: 2 }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {programs.map((program, idx) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={program.id}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05, duration: 0.5 }}
                                    >
                                        <ProgramCard
                                            program={program}
                                            enrollmentStatus={getEnrollmentStatus(program.id)}
                                            isAuthenticated={!!auth?.user}
                                        />
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Container>

                {/* Footer */}
                <Box sx={{ bgcolor: "grey.900", color: "grey.400", py: 8 }}>
                    <Container maxWidth="lg">
                        <Grid container spacing={8}>
                            <Grid item xs={12} md={4}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, color: "white" }}>
                                    <IconBrandTabler size={32} />
                                    <Typography variant="h5" fontWeight={700}>Crossview</Typography>
                                </Stack>
                                <Typography variant="body2" sx={{ maxWidth: 300 }}>
                                    Empowering institutions with modern, flexible, and reliable educational technology.
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
