/**
 * Student Orders — Enhanced order history with status chips,
 * multi-item display, and click-through to order detail.
 *
 * Data is fetched client-side via commerceApi (decoupled shell).
 */
import { useEffect, useState, useCallback } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    Alert,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { IconReceipt, IconRefresh } from "@tabler/icons-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import {
    getOrders,
    formatAmount,
    ORDER_STATUS_LABELS,
    ORDER_STATUS_COLORS,
} from "@/services/commerceApi";

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getOrders();
            if (res.ok) {
                setOrders(res.orders || []);
            } else {
                setError(res.message || "Failed to load orders.");
            }
        } catch {
            setError("A network error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return (
        <DashboardLayout role="student" breadcrumbs={[{ label: "Orders" }]}>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Head title="My Orders" />
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <IconReceipt size={24} />
                        <Typography variant="h5" fontWeight={700}>My Orders</Typography>
                    </Stack>
                    <Button component={Link} href="/programs/" variant="outlined">
                        Browse Programs
                    </Button>
                </Stack>

                {/* Error state */}
                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 2 }}
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                startIcon={<IconRefresh size={16} />}
                                onClick={fetchOrders}
                            >
                                Retry
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                )}

                <Card>
                    <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Reference</TableCell>
                                    <TableCell>Programs</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Amount</TableCell>
                                    <TableCell>Provider</TableCell>
                                    <TableCell>Date</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {/* Loading skeleton rows */}
                                {loading && orders.length === 0 && (
                                    <>
                                        {[...Array(4)].map((_, i) => (
                                            <TableRow key={`skel-${i}`}>
                                                <TableCell><Skeleton variant="text" width={100} /></TableCell>
                                                <TableCell><Skeleton variant="text" width={180} /></TableCell>
                                                <TableCell><Skeleton variant="rounded" width={80} height={24} /></TableCell>
                                                <TableCell align="right"><Skeleton variant="text" width={70} /></TableCell>
                                                <TableCell><Skeleton variant="text" width={60} /></TableCell>
                                                <TableCell><Skeleton variant="text" width={80} /></TableCell>
                                            </TableRow>
                                        ))}
                                    </>
                                )}

                                {/* Order rows */}
                                {!loading && orders.map((order) => {
                                    const programNames = (order.items || [])
                                        .map((i) => i.program?.name)
                                        .filter(Boolean)
                                        .join(", ") || order.program?.name || "—";

                                    return (
                                        <TableRow
                                            key={order.id}
                                            hover
                                            sx={{ cursor: "pointer" }}
                                            onClick={() => router.visit(`/commerce/orders/${order.id}/page/`)}
                                        >
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                                                    {order.reference}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {programNames}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={ORDER_STATUS_LABELS[order.status] || order.status}
                                                    color={ORDER_STATUS_COLORS[order.status] || "default"}
                                                    size="small"
                                                />
                                                {order.refundedMinor > 0 && (
                                                    <Typography variant="caption" color="error.main" display="block">
                                                        Refunded {formatAmount(order.refundedMinor, order.currency)}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight={600}>
                                                    {formatAmount(order.totalMinor || order.amountMinor, order.currency)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption">
                                                    {order.provider === "paystack" ? "Paystack" : "Bank Transfer"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption">
                                                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                                {/* Empty state */}
                                {!loading && orders.length === 0 && !error && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">No orders yet.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </Container>
        </DashboardLayout>
    );
}
