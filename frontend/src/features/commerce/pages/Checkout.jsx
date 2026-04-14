/**
 * Checkout Page — Custom flow with native M-Pesa STK push and popup Card.
 */
import { useState, useEffect, useCallback } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Divider,
    FormControl,
    FormControlLabel,
    Radio,
    RadioGroup,
    Skeleton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    IconArrowLeft,
    IconLock,
    IconDeviceMobile,
    IconCreditCard,
} from "@tabler/icons-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useCart } from "@/contexts/CartContext";
import PaymentPending from "@/features/commerce/components/PaymentPending";
import { resumePaystackTransaction } from "@/features/commerce/utils/paystackPopup";
import * as commerceApi from "@/services/commerceApi";
import { formatAmount } from "@/services/commerceApi";

const STEP_REVIEW = "review";
const STEP_PROCESSING = "processing";
const STEP_MPESA_PENDING = "mpesa_pending";
const STEP_PAYSTACK_PENDING = "paystack_pending"; // Native JS popup waiting

export default function Checkout({ paystack }) {
    const { checkout } = usePage().props;
    const { cart, loading: cartLoading, refreshCart } = useCart();
    const [step, setStep] = useState(STEP_REVIEW);
    const [error, setError] = useState("");
    const [order, setOrder] = useState(null);
    const [statusText, setStatusText] = useState("");
    const [preview, setPreview] = useState({ mode: "cart", items: [], itemCount: 0, totalMinor: 0, currency: "" });
    const [previewLoading, setPreviewLoading] = useState(false);

    // Payment Selection State
    const [paymentMethod, setPaymentMethod] = useState("mpesa");
    const [phoneNumber, setPhoneNumber] = useState("");
    const isDirectMode = checkout?.mode === "direct" && !!checkout?.programId;
    const directProgramId = isDirectMode ? Number(checkout.programId) : null;

    const handlePaid = useCallback((paidOrder) => {
        if (!paidOrder) {
            return;
        }
        setOrder((prev) => ({ ...(prev || {}), ...paidOrder }));
    }, []);

    useEffect(() => {
        if (!isDirectMode) {
            refreshCart();
            return;
        }
        let active = true;
        if (!Number.isFinite(directProgramId) || directProgramId <= 0) {
            setPreviewLoading(false);
            setError("Invalid direct checkout program.");
            return undefined;
        }
        setPreviewLoading(true);
        commerceApi
            .getCheckoutPreview([directProgramId])
            .then((res) => {
                if (!active) return;
                if (res.ok) {
                    setPreview(res);
                } else {
                    setError(res.message || "Unable to load checkout preview.");
                }
            })
            .finally(() => {
                if (active) setPreviewLoading(false);
            });
        return () => {
            active = false;
        };
    }, [refreshCart, isDirectMode, directProgramId]);

    const items = isDirectMode ? (preview?.items || []) : (cart?.items || []);
    const totalMinor = isDirectMode ? preview?.totalMinor : cart?.totalMinor;
    const totalCurrency = isDirectMode ? preview?.currency : cart?.currency;
    const isEmpty = isDirectMode
        ? !previewLoading && items.length === 0
        : !cartLoading && items.length === 0;

    const getOrderPageUrl = useCallback((orderId, paymentError = "") => {
        const params = new URLSearchParams();
        if (paymentError) {
            params.set("paymentError", paymentError);
        }
        const query = params.toString();
        return `/commerce/orders/${orderId}/page/${query ? `?${query}` : ""}`;
    }, []);

    const handlePlaceOrder = useCallback(async () => {
        setError("");

        if (paymentMethod === "mpesa") {
            if (!phoneNumber || phoneNumber.trim().length < 9) {
                setError("Please enter a valid M-Pesa phone number (e.g., 0712345678).");
                return;
            }
        }

        if (paymentMethod === "card" && !paystack?.publicKey) {
            setError("Paystack public key is not configured.");
            return;
        }

        setStep(STEP_PROCESSING);

        // 1. Create order from cart (always Paystack provider under the hood)
        const orderRes = await commerceApi.createOrder(
            "paystack",
            isDirectMode ? [directProgramId] : null,
        );
        if (!orderRes.ok) {
            setError(orderRes.message || "Failed to create order.");
            setStep(STEP_REVIEW);
            return;
        }

        const newOrder = orderRes.order;
        setOrder(newOrder);
        if (!isDirectMode) {
            refreshCart();
        }

        // 2. Handle Custom M-Pesa Flow vs Card Popup
        if (paymentMethod === "mpesa") {
            const mpesaRes = await commerceApi.chargePaystackMpesa(newOrder.id, phoneNumber);
            if (!mpesaRes.ok) {
                router.visit(
                    getOrderPageUrl(
                        newOrder.id,
                        mpesaRes.message || "Failed to initiate M-Pesa push.",
                    ),
                );
                return;
            }

            setOrder({ ...newOrder, reference: mpesaRes.reference });
            setStatusText(mpesaRes.statusText || "Please check your phone and enter your M-Pesa PIN.");
            setStep(STEP_MPESA_PENDING);

        } else if (paymentMethod === "card") {
            const paystackRes = await commerceApi.initializePaystack(newOrder.id, ["card"]);
            if (!paystackRes.ok) {
                router.visit(
                    getOrderPageUrl(
                        newOrder.id,
                        paystackRes.message || "Failed to initialize card payment.",
                    ),
                );
                return;
            }

            const accessCode = paystackRes.accessCode;
            const reference = paystackRes.reference || newOrder.reference;
            if (!accessCode) {
                router.visit(
                    getOrderPageUrl(newOrder.id, "Missing Paystack access code."),
                );
                return;
            }

            try {
                // Here we let the popup render, relying entirely on the native paystack process
                await resumePaystackTransaction({
                    accessCode,
                    publicKey: paystack.publicKey,
                    onSuccess: async (transaction) => {
                        const transactionReference =
                            transaction?.reference || transaction?.trxref || reference;
                        setOrder({ ...newOrder, reference: transactionReference });
                        setStep(STEP_PAYSTACK_PENDING);

                        const verifyRes = await commerceApi.verifyPaystack(
                            newOrder.id,
                            transactionReference
                        );
                        if (!verifyRes.ok) {
                            setError(verifyRes.message || "Unable to verify payment yet.");
                            return;
                        }

                        setOrder(verifyRes.order);
                        if (verifyRes.order?.status === "paid") {
                            handlePaid(verifyRes.order);
                        }
                    },
                    onCancel: () => {
                        router.visit(`/commerce/orders/${newOrder.id}/page/`);
                    },
                    onError: () => {
                        router.visit(
                            getOrderPageUrl(newOrder.id, "Unable to open Paystack checkout."),
                        );
                    },
                });
            } catch (popupError) {
                router.visit(
                    getOrderPageUrl(
                        newOrder.id,
                        popupError.message || "Unable to open Card checkout.",
                    ),
                );
            }
        }
    }, [getOrderPageUrl, handlePaid, isDirectMode, directProgramId, paystack, refreshCart, paymentMethod, phoneNumber]);

    // Determine primary program ID for "Go to Course" after payment
    const primaryProgramId = order?.items?.[0]?.program?.id || order?.program?.id || null;

    return (
        <DashboardLayout role="student" breadcrumbs={[{ label: "Programs", href: "/programs/" }, { label: "Checkout" }]}>
            <Container maxWidth="sm" sx={{ py: 4 }}>
                <Head title="Checkout" />

                {/* Back to programs */}
                {step === STEP_REVIEW && (
                    <Button
                        component={Link}
                        href={isDirectMode ? `/programs/${directProgramId}/` : "/programs/"}
                        startIcon={<IconArrowLeft size={18} />}
                        sx={{ mb: 2 }}
                    >
                        {isDirectMode ? "Back to Program" : "Browse More Programs"}
                    </Button>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                        {error}
                    </Alert>
                )}

                {/* Paystack Card popup pending */}
                {step === STEP_PAYSTACK_PENDING && order && (
                    <Card sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <PaymentPending
                                orderId={order.id}
                                onPaid={handlePaid}
                                programId={primaryProgramId}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* M-Pesa STK Pending wait screen */}
                {step === STEP_MPESA_PENDING && order && (
                    <Card sx={{ borderRadius: 2, textAlign: "center", py: 4 }}>
                        <CardContent>
                            <IconDeviceMobile size={48} color="#10B981" style={{ marginBottom: 16 }} />
                            <Typography variant="h5" fontWeight={700} gutterBottom>
                                Action Required
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                                {statusText}
                            </Typography>
                            
                            <PaymentPending
                                orderId={order.id}
                                onPaid={handlePaid}
                                programId={primaryProgramId}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Processing spinner */}
                {step === STEP_PROCESSING && (
                    <Card sx={{ borderRadius: 2, textAlign: "center", py: 6 }}>
                        <CardContent>
                            <Skeleton variant="circular" width={48} height={48} sx={{ mx: "auto", mb: 2 }} />
                            <Typography variant="h6">Processing your order…</Typography>
                        </CardContent>
                    </Card>
                )}

                {/* Review step */}
                {step === STEP_REVIEW && (
                    <Stack spacing={3}>
                        {/* Order summary */}
                        <Card sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                                    Order Summary
                                </Typography>

                                {(isDirectMode ? previewLoading : cartLoading) && (
                                    <Stack spacing={1}>
                                        <Skeleton variant="text" width="70%" />
                                        <Skeleton variant="text" width="40%" />
                                    </Stack>
                                )}

                                {isEmpty && (
                                    <Alert severity="warning">
                                        Your cart is empty.{" "}
                                        <Link href="/programs/">Browse programs</Link>
                                    </Alert>
                                )}

                                {!(isDirectMode ? previewLoading : cartLoading) && items.length > 0 && (
                                    <>
                                        {items.map((item) => (
                                            <Stack
                                                key={item.id}
                                                direction="row"
                                                justifyContent="space-between"
                                                sx={{ py: 1 }}
                                            >
                                                <Typography variant="body2">
                                                     {item.program?.name}
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {formatAmount(item.amountMinor, item.currency)}
                                                </Typography>
                                            </Stack>
                                        ))}
                                        <Divider sx={{ my: 1.5 }} />
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="subtitle1" fontWeight={700}>
                                                Total
                                            </Typography>
                                            <Typography variant="subtitle1" fontWeight={700}>
                                                 {formatAmount(totalMinor, totalCurrency)}
                                            </Typography>
                                        </Stack>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment Method Selector */}
                        {!isEmpty && (
                            <Card sx={{ borderRadius: 2 }}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                                        Payment Method
                                    </Typography>
                                    <FormControl component="fieldset" fullWidth>
                                        <RadioGroup
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        >
                                            <FormControlLabel
                                                value="mpesa"
                                                control={<Radio />}
                                                label={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <IconDeviceMobile size={20} />
                                                        <Typography fontWeight={600}>M-Pesa (Send Money)</Typography>
                                                    </Box>
                                                }
                                                sx={{ mb: paymentMethod === "mpesa" ? 1 : 2 }}
                                            />
                                            {paymentMethod === "mpesa" && (
                                                <Box sx={{ ml: 4, mb: 3 }}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label="M-Pesa Phone Number"
                                                        placeholder="e.g. 0712345678"
                                                        value={phoneNumber}
                                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                                        helperText="We will send a payment prompt to this number."
                                                    />
                                                </Box>
                                            )}

                                            <FormControlLabel
                                                value="card"
                                                control={<Radio />}
                                                label={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <IconCreditCard size={20} />
                                                        <Typography fontWeight={600}>Credit / Debit Card</Typography>
                                                    </Box>
                                                }
                                            />
                                            {paymentMethod === "card" && (
                                                <Box sx={{ ml: 4, mt: 1 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        You will be redirected to securely enter your card details.
                                                    </Typography>
                                                </Box>
                                            )}
                                        </RadioGroup>
                                    </FormControl>
                                </CardContent>
                            </Card>
                        )}

                        {/* Place order */}
                        {!isEmpty && (
                            <Button
                                variant="contained"
                                fullWidth
                                size="large"
                                onClick={handlePlaceOrder}
                                startIcon={<IconLock size={18} />}
                                sx={{ py: 1.5, fontWeight: 700 }}
                            >
                                {paymentMethod === "mpesa" 
                                     ? `Send STK Push • ${formatAmount(totalMinor, totalCurrency)}`
                                     : `Pay securely • ${formatAmount(totalMinor, totalCurrency)}`
                                 }
                            </Button>
                        )}
                    </Stack>
                )}
            </Container>
        </DashboardLayout>
    );
}
