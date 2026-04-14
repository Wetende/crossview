import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Grid,
    Snackbar,
    Stack,
    Typography,
} from "@mui/material";
import { IconArrowRight, IconHeartOff, IconTrash } from "@tabler/icons-react";
import PublicNavbar from "@/components/common/PublicNavbar";
import Footer from "@/components/common/Footer";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { formatAmount } from "@/services/commerceApi";

export default function Wishlist() {
    const { auth, platform } = usePage().props;
    const { addToCart } = useCart();
    const { wishlist, removeFromWishlist } = useWishlist();
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const items = useMemo(() => wishlist?.items || [], [wishlist]);

    const handleBuyNow = (programId) => {
        router.visit(`/checkout/?mode=direct&programId=${programId}`);
    };

    const handleAddToCart = async (programId) => {
        if (!programId) {
            return;
        }
        if (!auth?.user) {
            router.visit("/login/?next=/wishlist/");
            return;
        }

        const res = await addToCart(programId);
        if (res.ok) {
            setSnackbar({ open: true, message: "Added to cart.", severity: "success" });
            return;
        }
        if (res.error === "program_in_cart") {
            setSnackbar({ open: true, message: "Program is already in your cart.", severity: "info" });
            return;
        }
        setSnackbar({ open: true, message: res.message || "Unable to add item to cart.", severity: "error" });
    };

    const handleRemove = async (programId) => {
        const res = await removeFromWishlist(programId);
        if (!res.ok) {
            setSnackbar({ open: true, message: res.message || "Unable to remove item.", severity: "error" });
        }
    };

    return (
        <>
            <Head title={`Wishlist - ${platform?.institutionName || "Learning Platform"}`} />
            <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
                <PublicNavbar activeLink="/programs/" auth={auth} />

                <Container maxWidth="lg" sx={{ pt: 14, pb: 8 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Typography variant="h4" fontWeight={700}>Wishlist</Typography>
                        <Button component={Link} href="/programs/" endIcon={<IconArrowRight size={16} />}>
                            Browse Programs
                        </Button>
                    </Stack>

                    {items.length === 0 ? (
                        <Card>
                            <CardContent sx={{ textAlign: "center", py: 8 }}>
                                <IconHeartOff size={48} />
                                <Typography variant="h6" sx={{ mt: 2 }}>Your wishlist is empty</Typography>
                                <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                                    Save programs here to revisit and purchase later.
                                </Typography>
                                <Button component={Link} href="/programs/" variant="contained">
                                    Discover Programs
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Grid container spacing={2}>
                            {items.map((item) => (
                                <Grid key={item.id} size={{ xs: 12, md: 6 }}>
                                    <Card>
                                        <CardContent>
                                            <Stack spacing={1.5}>
                                                <Typography component={Link} href={`/programs/${item.program?.id}/`} sx={{ textDecoration: "none", fontWeight: 700, color: "text.primary" }}>
                                                    {item.program?.name || "Program"}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {formatAmount(item.amountMinor || 0, item.currency || "KES")}
                                                </Typography>
                                                <Stack direction="row" spacing={1}>
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => handleBuyNow(item.program?.id)}
                                                        disabled={!item.program?.id}
                                                    >
                                                        Buy Now
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        onClick={() => handleAddToCart(item.program?.id)}
                                                        disabled={!item.program?.id}
                                                    >
                                                        Add to Cart
                                                    </Button>
                                                    <Button
                                                        color="error"
                                                        startIcon={<IconTrash size={16} />}
                                                        onClick={() => handleRemove(item.program?.id)}
                                                        disabled={!item.program?.id}
                                                    >
                                                        Remove
                                                    </Button>
                                                </Stack>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Container>

                <Footer />
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3500}
                onClose={() => setSnackbar((state) => ({ ...state, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar((state) => ({ ...state, open: false }))}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}
