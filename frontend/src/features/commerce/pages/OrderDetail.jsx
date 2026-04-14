/**
 * OrderDetail — Student order detail page.
 * Fetches order from JSON endpoint and shows items, status, refunds.
 */
import { useState, useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Divider,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { IconArrowLeft, IconCreditCard, IconBuildingBank } from "@tabler/icons-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import PaymentPending from "@/features/commerce/components/PaymentPending";
import { resumePaystackTransaction } from "@/features/commerce/utils/paystackPopup";
import * as commerceApi from "@/services/commerceApi";
import {
    formatAmount,
    ORDER_STATUS_LABELS,
    ORDER_STATUS_COLORS,
} from "@/services/commerceApi";

export default function OrderDetail({ orderId: propOrderId, paystack }) {
    const initialError =
        typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("paymentError") || ""
            : "";
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(initialError);
    const [retrying, setRetrying] = useState(false);
    const [showPending, setShowPending] = useState(false);

    // orderId comes from Inertia props or URL param
    const orderId = propOrderId || (() => {
        const match = window.location.pathname.match(/\/commerce\/orders\/(\d+)\//);
        return match ? Number(match[1]) : null;
    })();

    useEffect(() => {
        if (!orderId) return;
        (async () => {
            setLoading(true);
            const res = await commerceApi.getOrder(orderId);
            if (res.ok) {
                setOrder(res.order);
            } else {
                setError(res.message || "Order not found.");
            }
            setLoading(false);
        })();
    }, [orderId]);

    const handleRetryPaystack = async () => {
        if (!order) return;
        setRetrying(true);
        setError("");
        const res = await commerceApi.initializePaystack(order.id);
        if (!res.ok || !res.accessCode) {
            setError(res.message || "Failed to initialize payment.");
            setRetrying(false);
            return;
        }

        try {
            await resumePaystackTransaction({
                accessCode: res.accessCode,
                publicKey: paystack?.publicKey,
                onSuccess: async (transaction) => {
                    const transactionReference =
                        transaction?.reference || transaction?.trxref || res.reference;
                    setShowPending(true);
                    const verifyRes = await commerceApi.verifyPaystack(order.id, transactionReference);
                    if (verifyRes.ok) {
                        setOrder(verifyRes.order);
                        if (verifyRes.order?.status === "paid") {
                            setShowPending(false);
                        }
                    } else {
                        setError(verifyRes.message || "Unable to verify payment yet.");
                    }
                    setRetrying(false);
                },
                onCancel: () => {
                    setRetrying(false);
                },
                onError: () => {
                    setError("Unable to open Paystack checkout.");
                    setRetrying(false);
                },
            });
        } catch (popupError) {
            setError(popupError.message || "Unable to open Paystack checkout.");
            setRetrying(false);
        }
    };

    const handlePaid = (paidOrder) => {
        if (!paidOrder) {
            return;
        }
        setShowPending(false);
        setOrder((prev) => ({ ...(prev || {}), ...paidOrder }));
    };

    // Show polling UI if order is pending_payment and provider is paystack
    const showPolling = order &&
        order.status === "pending_payment" &&
        order.provider === "paystack" &&
        (showPending || new URLSearchParams(window.location.search).has("verify"));

    const primaryProgramId = order?.items?.[0]?.program?.id || null;

    return (
        <DashboardLayout
            role="student"
            breadcrumbs={[
                { label: "Orders", href: "/student/orders/" },
                { label: order?.reference || "Order" },
            ]}
        >
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Head title={`Order ${order?.reference || ""}`} />

                <Button
                    component={Link}
                    href="/student/orders/"
                    startIcon={<IconArrowLeft size={18} />}
                    sx={{ mb: 2 }}
                >
                    Back to Orders
                </Button>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading && (
                    <Card>
                        <CardContent>
                            <Skeleton variant="text" width="40%" height={32} />
                            <Skeleton variant="text" width="60%" height={24} />
                            <Skeleton variant="rectangular" height={120} sx={{ mt: 2 }} />
                        </CardContent>
                    </Card>
                )}

                {showPolling && (
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <PaymentPending
                                orderId={order.id}
                                onPaid={handlePaid}
                                programId={primaryProgramId}
                            />
                        </CardContent>
                    </Card>
                )}

                {!loading && order && (
                    <Stack spacing={3}>
                        {/* Order header */}
                        <Card>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                    <Box>
                                        <Typography variant="h6" fontWeight={700}>
                                            Order {order.reference}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {order.createdAt
                                                ? new Date(order.createdAt).toLocaleDateString("en-GB", {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })
                                                : "—"}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={ORDER_STATUS_LABELS[order.status] || order.status}
                                        color={ORDER_STATUS_COLORS[order.status] || "default"}
                                        size="small"
                                    />
                                </Stack>

                                <Divider sx={{ my: 2 }} />

                                <Stack direction="row" spacing={4}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Provider
                                        </Typography>
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                            {order.provider === "paystack" ? (
                                                <IconCreditCard size={16} />
                                            ) : (
                                                <IconBuildingBank size={16} />
                                            )}
                                            <Typography variant="body2" fontWeight={600}>
                                                {order.provider === "paystack" ? "Paystack" : "Bank Transfer"}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Total
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700}>
                                            {formatAmount(order.totalMinor, order.currency)}
                                        </Typography>
                                    </Box>
                                    {order.refundedMinor > 0 && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Refunded
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600} color="error.main">
                                                {formatAmount(order.refundedMinor, order.currency)}
                                            </Typography>
                                        </Box>
                                    )}
                                    {order.paidAt && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Paid
                                            </Typography>
                                            <Typography variant="body2">
                                                {new Date(order.paidAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>

                                {/* Retry payment for pending orders */}
                                {(order.status === "pending_payment" || order.status === "failed") &&
                                    order.provider === "paystack" && (
                                        <Button
                                            variant="contained"
                                            onClick={handleRetryPaystack}
                                            disabled={retrying}
                                            sx={{ mt: 2 }}
                                        >
                                            {retrying ? "Redirecting…" : "Retry Payment"}
                                        </Button>
                                    )}
                            </CardContent>
                        </Card>

                        {/* Order items */}
                        <Card>
                            <CardContent>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                                    Items
                                </Typography>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Program</TableCell>
                                            <TableCell align="right">Amount</TableCell>
                                            <TableCell align="right">Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(order.items || []).map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {item.program?.name || item.programName}
                                                    </Typography>
                                                    {item.program?.code && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {item.program.code}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {formatAmount(item.amountMinor, item.currency)}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip
                                                        label={ORDER_STATUS_LABELS[item.status] || item.status}
                                                        color={ORDER_STATUS_COLORS[item.status] || "default"}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Refund history */}
                        {order.refunds && order.refunds.length > 0 && (
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                                        Refunds
                                    </Typography>
                                    {order.refunds.map((refund) => (
                                        <Card key={refund.id} variant="outlined" sx={{ mb: 1.5 }}>
                                            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                                                <Stack direction="row" justifyContent="space-between">
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {formatAmount(refund.amountMinor, order.currency)}
                                                        </Typography>
                                                        {refund.reason && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {refund.reason}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    <Chip
                                                        label={refund.status}
                                                        size="small"
                                                        color={refund.status === "processed" ? "success" : "warning"}
                                                    />
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </Stack>
                )}
            </Container>
        </DashboardLayout>
    );
}
