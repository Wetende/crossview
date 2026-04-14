/**
 * Admin Orders — Order management dashboard.
 * Fetches via JSON, supports mark-paid, cancel, and refund actions.
 */
import { useState, useEffect, useCallback } from "react";
import { Head } from "@inertiajs/react";
import {
    Alert,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import {
    IconCheck,
    IconX,
    IconRefresh,
    IconReceipt,
} from "@tabler/icons-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import * as commerceApi from "@/services/commerceApi";
import {
    formatAmount,
    ORDER_STATUS_LABELS,
    ORDER_STATUS_COLORS,
} from "@/services/commerceApi";

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [payouts, setPayouts] = useState([]);
    const [settlementParties, setSettlementParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payoutLoading, setPayoutLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [providerFilter, setProviderFilter] = useState("");

    // Dialog state
    const [dialog, setDialog] = useState({ type: null, order: null });
    const [actionLoading, setActionLoading] = useState(false);
    const [refundReason, setRefundReason] = useState("");
    const [refundNotes, setRefundNotes] = useState("");
    const [cancelReason, setCancelReason] = useState("");
    const [selectedRefundItemIds, setSelectedRefundItemIds] = useState([]);
    const [retryRefund, setRetryRefund] = useState({
        refundId: null,
        accountNumber: "",
        bankCode: "",
        accountName: "",
        countryCode: "KE",
    });
    const [payoutDraft, setPayoutDraft] = useState({
        settlementPartyId: "",
        amountMinor: "",
        currency: "KES",
        notes: "",
    });

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError("");
        const res = await commerceApi.getAdminOrders({
            status: statusFilter,
            provider: providerFilter,
        });
        if (res.ok) {
            setOrders(res.orders || []);
        } else {
            setError(res.message || "Failed to load orders.");
        }
        setLoading(false);
    }, [statusFilter, providerFilter]);

    const fetchPayouts = useCallback(async () => {
        setPayoutLoading(true);
        const res = await commerceApi.getAdminPayouts();
        if (res.ok) {
            setPayouts(res.payouts || []);
            setSettlementParties(res.settlementParties || []);
        } else {
            setError(res.message || "Failed to load payout data.");
        }
        setPayoutLoading(false);
    }, []);

    useEffect(() => {
        fetchOrders();
        fetchPayouts();
    }, [fetchOrders, fetchPayouts]);

    // --- Mark Paid ---
    const handleMarkPaid = async () => {
        if (!dialog.order) return;
        setActionLoading(true);
        const res = await commerceApi.adminMarkPaid(dialog.order.id);
        setActionLoading(false);
        if (res.ok) {
            setDialog({ type: null, order: null });
            fetchOrders();
            fetchPayouts();
        } else {
            setError(res.message || "Failed to mark order paid.");
        }
    };

    // --- Cancel ---
    const handleCancel = async () => {
        if (!dialog.order) return;
        setActionLoading(true);
        const res = await commerceApi.adminCancelOrder(dialog.order.id, cancelReason);
        setActionLoading(false);
        if (res.ok) {
            setDialog({ type: null, order: null });
            setCancelReason("");
            fetchOrders();
            fetchPayouts();
        } else {
            setError(res.message || "Failed to cancel order.");
        }
    };

    // --- Refund ---
    const handleRefund = async () => {
        if (!dialog.order) return;
        setActionLoading(true);
        const res = await commerceApi.adminRefundOrder(dialog.order.id, {
            orderItemIds: selectedRefundItemIds.length > 0 ? selectedRefundItemIds : null,
            reason: refundReason,
            notes: refundNotes,
        });
        setActionLoading(false);
        if (res.ok) {
            setDialog({ type: null, order: null });
            setRefundReason("");
            setRefundNotes("");
            setSelectedRefundItemIds([]);
            fetchOrders();
            fetchPayouts();
        } else {
            setError(res.message || "Failed to process refund.");
        }
    };

    // --- Retry refund ---
    const handleRetryRefund = async () => {
        if (!retryRefund.refundId) return;
        setActionLoading(true);
        const res = await commerceApi.adminRetryRefund(retryRefund.refundId, {
            refundAccountDetails: {
                account_number: retryRefund.accountNumber,
                bank_code: retryRefund.bankCode,
                account_name: retryRefund.accountName,
                country_code: retryRefund.countryCode,
            },
        });
        setActionLoading(false);
        if (res.ok) {
            setRetryRefund({
                refundId: null,
                accountNumber: "",
                bankCode: "",
                accountName: "",
                countryCode: "KE",
            });
            fetchOrders();
            fetchPayouts();
        } else {
            setError(res.message || "Failed to retry refund.");
        }
    };

    const handleCreatePayout = async () => {
        setActionLoading(true);
        const res = await commerceApi.createAdminPayout({
            settlementPartyId: Number(payoutDraft.settlementPartyId),
            amountMinor: Number(payoutDraft.amountMinor),
            currency: payoutDraft.currency,
            notes: payoutDraft.notes,
        });
        setActionLoading(false);
        if (res.ok) {
            setPayoutDraft({
                settlementPartyId: "",
                amountMinor: "",
                currency: "KES",
                notes: "",
            });
            setDialog({ type: null, order: null });
            fetchPayouts();
        } else {
            setError(res.message || "Failed to create payout.");
        }
    };

    const handleSendPayout = async (payoutId) => {
        setActionLoading(true);
        const res = await commerceApi.adminSendPayout(payoutId);
        setActionLoading(false);
        if (res.ok) {
            fetchPayouts();
        } else {
            setError(res.message || "Failed to send payout.");
        }
    };

    const openDialog = (type, order) => {
        setDialog({ type, order });
        setSelectedRefundItemIds([]);
        setRefundReason("");
        setRefundNotes("");
        setCancelReason("");
        setPayoutDraft({
            settlementPartyId: "",
            amountMinor: "",
            currency: "KES",
            notes: "",
        });
        setError("");
    };

    const closeDialog = () => {
        setDialog({ type: null, order: null });
        setPayoutDraft({
            settlementPartyId: "",
            amountMinor: "",
            currency: "KES",
            notes: "",
        });
    };

    const toggleRefundItem = (itemId) => {
        setSelectedRefundItemIds((prev) =>
            prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
        );
    };

    const openRetryRefundDialog = (refundId) => {
        setRetryRefund({
            refundId,
            accountNumber: "",
            bankCode: "",
            accountName: "",
            countryCode: "KE",
        });
    };

    const closeRetryRefundDialog = () => {
        setRetryRefund({
            refundId: null,
            accountNumber: "",
            bankCode: "",
            accountName: "",
            countryCode: "KE",
        });
    };

    const selectedSettlementParty = settlementParties.find(
        (party) => String(party.id) === String(payoutDraft.settlementPartyId)
    );
    const selectedBalanceSummary =
        selectedSettlementParty?.balances?.[payoutDraft.currency] || null;

    return (
        <DashboardLayout role="admin" breadcrumbs={[{ label: "Commerce" }, { label: "Orders" }]}>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Head title="Orders — Admin" />

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <IconReceipt size={24} />
                        <Typography variant="h5" fontWeight={700}>
                            Orders
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="contained"
                            onClick={() => openDialog("payout", null)}
                        >
                            New Payout
                        </Button>
                        <Button
                            startIcon={<IconRefresh size={18} />}
                            onClick={() => {
                                fetchOrders();
                                fetchPayouts();
                            }}
                            disabled={loading || payoutLoading}
                        >
                            Refresh
                        </Button>
                    </Stack>
                </Stack>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                        {error}
                    </Alert>
                )}

                {/* Filters */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Stack direction="row" spacing={2}>
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Status"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                                        <MenuItem key={value} value={value}>
                                            {label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>Provider</InputLabel>
                                <Select
                                    value={providerFilter}
                                    label="Provider"
                                    onChange={(e) => setProviderFilter(e.target.value)}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="paystack">Paystack</MenuItem>
                                    <MenuItem value="offline_bank_transfer">Bank Transfer</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Orders table */}
                <Card>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Reference</TableCell>
                                    <TableCell>User</TableCell>
                                    <TableCell>Items</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Provider</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={8}>
                                            <Skeleton variant="rectangular" height={40} />
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && orders.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">
                                                No orders found.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && orders.map((order) => {
                                    const hasRefundInProgress = (order.refunds || []).some((refund) =>
                                        ["pending", "processing", "needs_attention"].includes(refund.status)
                                    );

                                    return (
                                    <TableRow key={order.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600} sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                                                {order.reference}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {order.program?.name || (order.items || []).map((i) => i.program?.name).filter(Boolean).join(", ") || "—"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {(order.items || []).length} item{(order.items || []).length !== 1 ? "s" : ""}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={ORDER_STATUS_LABELS[order.status] || order.status}
                                                color={ORDER_STATUS_COLORS[order.status] || "default"}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption">
                                                {order.provider === "paystack" ? "Paystack" : "Bank Transfer"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={600}>
                                                {formatAmount(order.totalMinor, order.currency)}
                                            </Typography>
                                            {order.refundedMinor > 0 && (
                                                <Typography variant="caption" color="error.main">
                                                    -{formatAmount(order.refundedMinor, order.currency)}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption">
                                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                {order.status === "pending_manual_payment" && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="success"
                                                        startIcon={<IconCheck size={14} />}
                                                        onClick={() => openDialog("mark_paid", order)}
                                                    >
                                                        Mark Paid
                                                    </Button>
                                                )}
                                                {["paid", "partially_refunded"].includes(order.status) && !hasRefundInProgress && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="warning"
                                                        onClick={() => openDialog("refund", order)}
                                                    >
                                                        Refund
                                                    </Button>
                                                )}
                                                {["created", "pending_payment", "pending_manual_payment"].includes(order.status) && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="error"
                                                        startIcon={<IconX size={14} />}
                                                        onClick={() => openDialog("cancel", order)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                                {/* Retry refund for needs_attention */}
                                                {(order.refunds || []).some((r) => r.status === "needs_attention") && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<IconRefresh size={14} />}
                                                        onClick={() => {
                                                            const refund = order.refunds.find((r) => r.status === "needs_attention");
                                                            if (refund) openRetryRefundDialog(refund.id);
                                                        }}
                                                        disabled={actionLoading}
                                                    >
                                                        Retry Refund
                                                    </Button>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>

                <Card sx={{ mt: 3 }}>
                    <CardContent>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mb: 2 }}
                        >
                            <Typography variant="h6" fontWeight={700}>
                                Payout Queue
                            </Typography>
                            <Button onClick={() => openDialog("payout", null)}>
                                Create Payout
                            </Button>
                        </Stack>

                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, rowGap: 1 }}>
                            {settlementParties.map((party) => {
                                const balances = Object.entries(party.balances || {});
                                return (
                                    <Chip
                                        key={party.id}
                                        label={`${party.displayName}: ${
                                            balances.length > 0
                                                ? balances
                                                    .map(([currency, value]) =>
                                                        `${currency} ${formatAmount(value.availableMinor, currency).replace(`${currency} `, "")}`
                                                    )
                                                    .join(" • ")
                                                : "No balance"
                                        }`}
                                        variant="outlined"
                                    />
                                );
                            })}
                        </Stack>

                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Party</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell align="right">Amount</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Reference</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {payoutLoading && (
                                        <TableRow>
                                            <TableCell colSpan={7}>
                                                <Skeleton variant="rectangular" height={40} />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {!payoutLoading && payouts.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                                <Typography color="text.secondary">
                                                    No payouts created yet.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {!payoutLoading && payouts.map((payout) => (
                                        <TableRow key={payout.id}>
                                            <TableCell>{payout.settlementParty?.displayName || "—"}</TableCell>
                                            <TableCell sx={{ textTransform: "capitalize" }}>
                                                {payout.settlementParty?.partyType || "—"}
                                            </TableCell>
                                            <TableCell align="right">
                                                {formatAmount(payout.amountMinor, payout.currency)}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={(payout.status || "").replaceAll("_", " ")}
                                                    color={
                                                        payout.status === "paid"
                                                            ? "success"
                                                            : payout.status === "failed"
                                                                ? "error"
                                                                : payout.status === "processing"
                                                                    ? "warning"
                                                                    : payout.status === "reversed"
                                                                        ? "secondary"
                                                                        : "default"
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                                                {payout.reference || payout.providerReference || "—"}
                                            </TableCell>
                                            <TableCell>
                                                {payout.createdAt ? new Date(payout.createdAt).toLocaleDateString() : "—"}
                                            </TableCell>
                                            <TableCell align="right">
                                                {payout.status === "pending_approval" && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        onClick={() => handleSendPayout(payout.id)}
                                                        disabled={actionLoading}
                                                    >
                                                        Send
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Container>

            {/* --- Mark Paid Dialog --- */}
            <Dialog open={dialog.type === "mark_paid"} onClose={closeDialog} maxWidth="xs" fullWidth>
                <DialogTitle>Mark Order Paid</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Confirm that payment has been received for order{" "}
                        <strong>{dialog.order?.reference}</strong>?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This will grant program access to the student.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleMarkPaid}
                        disabled={actionLoading}
                    >
                        Confirm Paid
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- Cancel Dialog --- */}
            <Dialog open={dialog.type === "cancel"} onClose={closeDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Cancel Order</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Cancel order <strong>{dialog.order?.reference}</strong>?
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Reason (optional)"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>Back</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleCancel}
                        disabled={actionLoading}
                    >
                        Cancel Order
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- Refund Dialog --- */}
            <Dialog open={dialog.type === "refund"} onClose={closeDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Refund Order</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Select items to refund for order <strong>{dialog.order?.reference}</strong>.
                        Leave all unchecked for a full refund.
                    </Typography>

                    {(dialog.order?.items || []).map((item) => (
                        <FormControlLabel
                            key={item.id}
                            control={
                                <Checkbox
                                    checked={selectedRefundItemIds.includes(item.id)}
                                    onChange={() => toggleRefundItem(item.id)}
                                    disabled={item.status === "refunded"}
                                />
                            }
                            label={
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="body2">
                                        {item.program?.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatAmount(item.amountMinor, item.currency)}
                                    </Typography>
                                    {item.status === "refunded" && (
                                        <Chip label="Already refunded" size="small" color="default" />
                                    )}
                                </Stack>
                            }
                            sx={{ display: "flex", mb: 1 }}
                        />
                    ))}

                    <TextField
                        fullWidth
                        label="Reason"
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Internal notes (optional)"
                        value={refundNotes}
                        onChange={(e) => setRefundNotes(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>Back</Button>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={handleRefund}
                        disabled={actionLoading}
                    >
                        Process Refund
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={Boolean(retryRefund.refundId)}
                onClose={closeRetryRefundDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Retry Paystack Refund</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Paystack needs destination details before it can complete this refund.
                    </Typography>
                    <TextField
                        fullWidth
                        label="Account / Mobile Number"
                        value={retryRefund.accountNumber}
                        onChange={(e) => setRetryRefund((prev) => ({ ...prev, accountNumber: e.target.value }))}
                        sx={{ mt: 1 }}
                    />
                    <TextField
                        fullWidth
                        label="Bank / Telco Code"
                        value={retryRefund.bankCode}
                        onChange={(e) => setRetryRefund((prev) => ({ ...prev, bankCode: e.target.value }))}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Account Name"
                        value={retryRefund.accountName}
                        onChange={(e) => setRetryRefund((prev) => ({ ...prev, accountName: e.target.value }))}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Country Code"
                        value={retryRefund.countryCode}
                        onChange={(e) => setRetryRefund((prev) => ({ ...prev, countryCode: e.target.value.toUpperCase() }))}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeRetryRefundDialog}>Back</Button>
                    <Button
                        variant="contained"
                        onClick={handleRetryRefund}
                        disabled={actionLoading}
                    >
                        Retry Refund
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={dialog.type === "payout"} onClose={closeDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Create Payout</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel>Settlement Party</InputLabel>
                        <Select
                            value={payoutDraft.settlementPartyId}
                            label="Settlement Party"
                            onChange={(e) =>
                                setPayoutDraft((prev) => ({
                                    ...prev,
                                    settlementPartyId: e.target.value,
                                }))
                            }
                        >
                            {settlementParties.map((party) => (
                                <MenuItem key={party.id} value={String(party.id)}>
                                    {party.displayName} ({party.partyType})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        label="Amount (minor units)"
                        type="number"
                        value={payoutDraft.amountMinor}
                        onChange={(e) =>
                            setPayoutDraft((prev) => ({
                                ...prev,
                                amountMinor: e.target.value,
                            }))
                        }
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Currency"
                        value={payoutDraft.currency}
                        onChange={(e) =>
                            setPayoutDraft((prev) => ({
                                ...prev,
                                currency: e.target.value.toUpperCase(),
                            }))
                        }
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Notes"
                        value={payoutDraft.notes}
                        onChange={(e) =>
                            setPayoutDraft((prev) => ({
                                ...prev,
                                notes: e.target.value,
                            }))
                        }
                        sx={{ mt: 2 }}
                    />
                    {selectedBalanceSummary && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Available balance: {formatAmount(selectedBalanceSummary.availableMinor, payoutDraft.currency)}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>Back</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreatePayout}
                        disabled={actionLoading}
                    >
                        Create Payout
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}
