import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Grid,
    Stack,
    useTheme,
    Button,
    TextField,
    InputAdornment,
    FormControl,
    Select,
    MenuItem,
} from "@mui/material";
import { IconBrandTabler, IconSearch, IconBook } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { getBackgroundDots } from "../../utils/getBackgroundDots";
import { useState } from "react";
import ProgramGrid from "../../components/lists/ProgramGrid";
import PublicNavbar from "../../components/common/PublicNavbar";

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

export default function Programs({
    programs,
    filters,
    categories = [],
    userEnrollments = [],
    userPendingRequests = [],
}) {
    const theme = useTheme();
    const { auth } = usePage().props;
    const [search, setSearch] = useState(filters.search || "");
    const [selectedCategory, setSelectedCategory] = useState(
        filters.category || "",
    );

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (selectedCategory) params.set("category", selectedCategory);
        router.get(
            `/programs/?${params.toString()}`,
            {},
            { preserveState: true, replace: true },
        );
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (category) params.set("category", category);
        router.get(
            `/programs/?${params.toString()}`,
            {},
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Academic Programs - Crossview LMS" />

            <Box
                sx={{
                    minHeight: "100vh",
                    bgcolor: "#f5f7fa",
                    overflowX: "hidden",
                }}
            >
                {/* Navbar */}
                <PublicNavbar activeLink="/programs/" auth={auth} />

                {/* Hero Section */}
                <Box
                    sx={{
                        position: "relative",
                        pt: { xs: 16, md: 20 },
                        pb: { xs: 4, md: 6 },
                    }}
                >
                    <Box
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: getBackgroundDots(
                                theme.palette.grey[300],
                                2,
                                30,
                            ),
                            zIndex: -1,
                            maskImage:
                                "linear-gradient(to bottom, black 0%, transparent 100%)",
                        }}
                    />
                    <Container maxWidth="lg">
                        <motion.div {...fadeInUp}>
                            <Typography
                                variant="h3"
                                fontWeight={700}
                                gutterBottom
                            >
                                Explore Courses
                            </Typography>
                            <Typography
                                variant="h6"
                                color="text.secondary"
                                sx={{ maxWidth: 600, mb: 4, fontWeight: 400 }}
                            >
                                Discover our diverse range of programs designed
                                to equip you with skills for the future.
                            </Typography>

                            {/* Search & Filter Row */}
                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                spacing={2}
                                sx={{ maxWidth: 700 }}
                            >
                                <Box
                                    component="form"
                                    onSubmit={handleSearch}
                                    sx={{ flex: 1 }}
                                >
                                    <TextField
                                        fullWidth
                                        placeholder="Search courses..."
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        size="small"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <IconSearch
                                                        size={20}
                                                        color={
                                                            theme.palette.text
                                                                .secondary
                                                        }
                                                    />
                                                </InputAdornment>
                                            ),
                                            sx: {
                                                bgcolor: "background.paper",
                                                borderRadius: 2,
                                            },
                                        }}
                                    />
                                </Box>
                                {categories.length > 0 && (
                                    <FormControl
                                        size="small"
                                        sx={{ minWidth: 150 }}
                                    >
                                        <Select
                                            displayEmpty
                                            value={selectedCategory}
                                            onChange={(e) =>
                                                handleCategoryChange(
                                                    e.target.value,
                                                )
                                            }
                                            sx={{
                                                bgcolor: "background.paper",
                                                borderRadius: 2,
                                            }}
                                        >
                                            <MenuItem value="">
                                                All Categories
                                            </MenuItem>
                                            {categories.map((cat) => (
                                                <MenuItem key={cat} value={cat}>
                                                    {cat}
                                                </MenuItem>
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
                            <IconBook
                                size={48}
                                color={theme.palette.grey[400]}
                            />
                            <Typography
                                variant="h6"
                                color="text.secondary"
                                sx={{ mt: 2 }}
                            >
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
                        <ProgramGrid
                            programs={programs}
                            isAuthenticated={!!auth?.user}
                            userEnrollments={userEnrollments}
                            userPendingRequests={userPendingRequests}
                        />
                    )}
                </Container>

                {/* Footer */}
                <Box sx={{ bgcolor: "grey.900", color: "grey.400", py: 8 }}>
                    <Container maxWidth="lg">
                        <Grid container spacing={8}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    sx={{ mb: 2, color: "white" }}
                                >
                                    <IconBrandTabler size={32} />
                                    <Typography variant="h5" fontWeight={700}>
                                        Crossview
                                    </Typography>
                                </Stack>
                                <Typography
                                    variant="body2"
                                    sx={{ maxWidth: 300 }}
                                >
                                    Empowering institutions with modern,
                                    flexible, and reliable educational
                                    technology.
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 6, md: 2 }}>
                                <Typography
                                    variant="subtitle2"
                                    color="white"
                                    gutterBottom
                                >
                                    Platform
                                </Typography>
                                <Stack spacing={1}>
                                    <Link
                                        href="/programs/"
                                        style={{
                                            color: "inherit",
                                            textDecoration: "none",
                                        }}
                                    >
                                        Programs
                                    </Link>
                                    <Link
                                        href="/about/"
                                        style={{
                                            color: "inherit",
                                            textDecoration: "none",
                                        }}
                                    >
                                        About
                                    </Link>
                                </Stack>
                            </Grid>
                            <Grid size={{ xs: 6, md: 2 }}>
                                <Typography
                                    variant="subtitle2"
                                    color="white"
                                    gutterBottom
                                >
                                    Support
                                </Typography>
                                <Stack spacing={1}>
                                    <Link
                                        href="/contact/"
                                        style={{
                                            color: "inherit",
                                            textDecoration: "none",
                                        }}
                                    >
                                        Contact
                                    </Link>
                                    <Link
                                        href="/verify-certificate/"
                                        style={{
                                            color: "inherit",
                                            textDecoration: "none",
                                        }}
                                    >
                                        Verify Certificate
                                    </Link>
                                </Stack>
                            </Grid>
                        </Grid>
                        <Box
                            sx={{
                                mt: 8,
                                pt: 4,
                                borderTop: 1,
                                borderColor: "grey.800",
                                textAlign: "center",
                            }}
                        >
                            <Typography variant="caption">
                                © 2025 Crossview LMS. All rights reserved.
                            </Typography>
                        </Box>
                    </Container>
                </Box>
            </Box>
        </>
    );
}
