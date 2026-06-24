/**
 * Cart Page — Shopping cart with program items.
 * Fetches cart data from JSON endpoint, not Inertia props.
 */
import { useState, useEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Divider,
    IconButton,
    Skeleton,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    IconTrash,
    IconShoppingCart,
    IconArrowRight,
    IconArrowLeft,
} from "@tabler/icons-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/hooks/useCurrency";

export default function Cart() {
    const { cart, loading, removeFromCart, clearCart, refreshCart } = useCart();
    const { formatMinorCurrency } = useCurrency();
    const [removing, setRemoving] = useState(null);
    const [clearing, setClearing] = useState(false);
    const [error, setError] = useState("");

    // Refresh cart on mount in case it's stale
    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    const handleRemove = async (programId) => {
        setRemoving(programId);
        setError("");
        const res = await removeFromCart(programId);
        if (!res.ok) {
            setError(res.message || "Failed to remove item.");
        }
        setRemoving(null);
    };

    const handleClear = async () => {
        setClearing(true);
        setError("");
        const res = await clearCart();
        if (!res.ok) {
            setError(res.message || "Failed to clear cart.");
        }
        setClearing(false);
    };

    const items = cart?.items || [];
    const isEmpty = !loading && items.length === 0;

    return (
        <DashboardLayout role="student" breadcrumbs={[{ label: "Cart" }]}>
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Head title="Shopping Cart" />

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <IconShoppingCart size={24} />
                        <Typography variant="h5" fontWeight={700}>
                            Shopping Cart
                        </Typography>
                        {cart?.itemCount > 0 && (
                            <Typography variant="body2" color="text.secondary">
                                ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})
                            </Typography>
                        )}
                    </Stack>
                    {items.length > 0 && (
                        <Button
                            size="small"
                            color="error"
                            onClick={handleClear}
                            disabled={clearing}
                        >
                            Clear Cart
                        </Button>
                    )}
                </Stack>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                        {error}
                    </Alert>
                )}

                {/* Loading skeleton */}
                {loading && (
                    <Stack spacing={2}>
                        {[1, 2].map((k) => (
                            <Card key={k}>
                                <CardContent>
                                    <Skeleton variant="text" width="60%" height={28} />
                                    <Skeleton variant="text" width="30%" height={20} />
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}

                {/* Empty state */}
                {isEmpty && (
                    <Card sx={{ textAlign: "center", py: 6 }}>
                        <CardContent>
                            <IconShoppingCart size={48} color="#999" />
                            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                                Your cart is empty
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Browse our programs and add them to your cart to get started.
                            </Typography>
                            <Button
                                component={Link}
                                href="/programs/"
                                variant="contained"
                                startIcon={<IconArrowLeft size={18} />}
                            >
                                Browse Programs
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Cart items */}
                {!loading && items.length > 0 && (
                    <Stack spacing={2}>
                        {items.map((item) => (
                            <Card key={item.id}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Box sx={{ flex: 1 }}>
                                            <Typography
                                                variant="subtitle1"
                                                fontWeight={600}
                                                component={Link}
                                                href={item.program.publicUrl}
                                                sx={{
                                                    textDecoration: "none",
                                                    color: "text.primary",
                                                    "&:hover": { color: "primary.main" },
                                                }}
                                            >
                                                {item.program.name}
                                            </Typography>
                                            {item.program.code && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.program.code}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Typography variant="subtitle1" fontWeight={700}>
                                                {formatMinorCurrency(item.amountMinor)}
                                            </Typography>
                                            <Tooltip title="Remove from cart">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleRemove(item.program.id)}
                                                    disabled={removing === item.program.id}
                                                >
                                                    <IconTrash size={18} />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Cart summary */}
                        <Card>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        Subtotal
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700}>
                                        {formatMinorCurrency(cart?.totalMinor)}
                                    </Typography>
                                </Stack>
                                <Divider sx={{ my: 2 }} />
                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    endIcon={<IconArrowRight size={18} />}
                                    onClick={() => router.visit("/checkout/")}
                                    sx={{ py: 1.5, fontWeight: 700 }}
                                >
                                    Proceed to Checkout
                                </Button>
                            </CardContent>
                        </Card>
                    </Stack>
                )}
            </Container>
        </DashboardLayout>
    );
}
