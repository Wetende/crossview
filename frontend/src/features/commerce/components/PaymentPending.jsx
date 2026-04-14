/**
 * PaymentPending — Polling status component for Paystack payments.
 * Shows a spinner while waiting for webhook confirmation,
 * then transitions to success or failure state.
 */
import { useState, useEffect, useRef } from "react";
import {
    Box,
    CircularProgress,
    Stack,
    Typography,
    Button,
    Alert,
} from "@mui/material";
import { IconCheck, IconAlertTriangle } from "@tabler/icons-react";
import { Link } from "@inertiajs/react";
import * as commerceApi from "@/services/commerceApi";

const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 12; // ~36 seconds total

export default function PaymentPending({ orderId, onPaid, programId }) {
    const [status, setStatus] = useState("polling"); // polling | paid | failed | timeout
    const [attempts, setAttempts] = useState(0);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!orderId) return;
        let isActive = true;

        async function poll() {
            try {
                const res = await commerceApi.getOrderStatus(orderId);
                if (res.ok) {
                    const orderStatus = res.order?.status;
                    if (orderStatus === "paid") {
                        clearInterval(intervalRef.current);
                        if (!isActive) {
                            return;
                        }

                        const orderRes = await commerceApi.getOrder(orderId);
                        if (!isActive) {
                            return;
                        }

                        setStatus("paid");
                        if (orderRes.ok) {
                            onPaid?.(orderRes.order);
                        }
                        return;
                    }
                    if (orderStatus === "failed" || orderStatus === "cancelled") {
                        if (!isActive) {
                            return;
                        }
                        setStatus("failed");
                        clearInterval(intervalRef.current);
                        return;
                    }
                }
            } catch {
                // Network error — keep polling
            }
            setAttempts((prev) => {
                const next = prev + 1;
                if (next >= MAX_ATTEMPTS) {
                    if (!isActive) {
                        return prev;
                    }
                    setStatus("timeout");
                    clearInterval(intervalRef.current);
                }
                return next;
            });
        }

        intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
        // Do an immediate first poll
        poll();

        return () => {
            isActive = false;
            clearInterval(intervalRef.current);
        };
    }, [orderId, onPaid]);

    if (status === "paid") {
        return (
            <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
                <Box
                    sx={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        bgcolor: "success.light",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <IconCheck size={32} color="var(--mui-palette-success-main, #2e7d32)" />
                </Box>
                <Typography variant="h6" fontWeight={700}>
                    Payment Confirmed!
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                    Your access has been granted. You can now start learning.
                </Typography>
                <Stack direction="row" spacing={2}>
                    {programId && (
                        <Button
                            component={Link}
                            href={`/student/programs/${programId}/`}
                            variant="contained"
                        >
                            Go to Course
                        </Button>
                    )}
                    <Button
                        component={Link}
                        href="/student/orders/"
                        variant="outlined"
                    >
                        View Orders
                    </Button>
                </Stack>
            </Stack>
        );
    }

    if (status === "failed") {
        return (
            <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
                <Box
                    sx={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        bgcolor: "error.light",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <IconAlertTriangle size={32} color="var(--mui-palette-error-main, #d32f2f)" />
                </Box>
                <Typography variant="h6" fontWeight={700}>
                    Payment Failed
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                    Your payment was not completed. You can try again from your orders page.
                </Typography>
                <Button component={Link} href="/student/orders/" variant="contained">
                    View Orders
                </Button>
            </Stack>
        );
    }

    if (status === "timeout") {
        return (
            <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
                <Alert severity="info" sx={{ maxWidth: 480 }}>
                    Payment is still being processed. This can take a few minutes.
                    Check your orders page shortly for an update.
                </Alert>
                <Button component={Link} href="/student/orders/" variant="contained">
                    View Orders
                </Button>
            </Stack>
        );
    }

    // Polling state
    return (
        <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
            <CircularProgress size={48} />
            <Typography variant="h6" fontWeight={600}>
                Verifying Payment…
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
                We&apos;re confirming your payment with the provider.
                Please don&apos;t close this page.
            </Typography>
            <Typography variant="caption" color="text.disabled">
                Attempt {attempts + 1} of {MAX_ATTEMPTS}
            </Typography>
        </Stack>
    );
}
