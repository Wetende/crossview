import { Head, Link } from "@inertiajs/react";
import {
    Box,
    Button,
    CircularProgress,
    Grid,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import { IconBook2, IconHeart, IconSearch } from "@tabler/icons-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import PublicProgramCard from "@/components/cards/PublicProgramCard";
import { useWishlist } from "@/contexts/WishlistContext";

export default function Wishlist() {
    const { wishlist, loading } = useWishlist();
    const items = wishlist?.items || [];

    return (
        <DashboardLayout
            role="student"
            breadcrumbs={[{ label: "My wishlist" }]}
        >
            <Head title="My wishlist" />

            <Stack spacing={3} sx={{ maxWidth: 1200, mx: "auto" }}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                >
                    <Box>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                            <IconHeart size={26} />
                            <Typography component="h1" variant="h4" fontWeight={800}>
                                My wishlist
                            </Typography>
                        </Stack>
                        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                            Keep promising courses together until you are ready to
                            start learning.
                        </Typography>
                    </Box>
                    <Button
                        component={Link}
                        href="/programs/"
                        variant="outlined"
                        startIcon={<IconSearch size={18} />}
                    >
                        Browse courses
                    </Button>
                </Stack>

                {loading ? (
                    <Paper
                        variant="outlined"
                        sx={{ py: 9, textAlign: "center", borderRadius: 3 }}
                    >
                        <CircularProgress size={30} />
                        <Typography color="text.secondary" sx={{ mt: 2 }}>
                            Loading saved courses…
                        </Typography>
                    </Paper>
                ) : items.length === 0 ? (
                    <Paper
                        variant="outlined"
                        sx={{
                            py: { xs: 7, md: 10 },
                            px: 3,
                            textAlign: "center",
                            borderRadius: 3,
                            borderStyle: "dashed",
                            bgcolor: "background.default",
                        }}
                    >
                        <Box
                            sx={{
                                width: 72,
                                height: 72,
                                borderRadius: "50%",
                                display: "grid",
                                placeItems: "center",
                                mx: "auto",
                                mb: 2,
                                bgcolor: "action.hover",
                            }}
                        >
                            <IconBook2 size={34} />
                        </Box>
                        <Typography variant="h5" fontWeight={800}>
                            No saved courses yet
                        </Typography>
                        <Typography
                            color="text.secondary"
                            sx={{ mt: 1, mb: 3, maxWidth: 460, mx: "auto" }}
                        >
                            Select the heart on any course to keep it here for
                            later comparison.
                        </Typography>
                        <Button component={Link} href="/programs/" variant="contained">
                            Explore courses
                        </Button>
                    </Paper>
                ) : (
                    <>
                        <Typography variant="body2" color="text.secondary">
                            {items.length} saved {items.length === 1 ? "course" : "courses"}
                        </Typography>
                        <Grid container spacing={3}>
                            {items.map((item) => (
                                <Grid
                                    key={item.id || item.program?.id}
                                    size={{ xs: 12, sm: 6, lg: 4 }}
                                >
                                    <PublicProgramCard program={item.program} />
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}
            </Stack>
        </DashboardLayout>
    );
}
