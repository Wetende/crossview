/**
 * Checkout Page — M-Pesa and card payment flow.
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
    IconBuildingBank,
} from "@tabler/icons-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { useCart } from "@/contexts/CartContext";
import OfflineInstructions from "@/features/commerce/components/OfflineInstructions";
import PaymentPending from "@/features/commerce/components/PaymentPending";
import { resumePaystackTransaction } from "@/features/commerce/utils/paystackPopup";
import * as commerceApi from "@/services/commerceApi";
import { useCurrency } from "@/hooks/useCurrency";

const STEP_REVIEW = "review";
const STEP_PROCESSING = "processing";
const STEP_MPESA_PENDING = "mpesa_pending";
const STEP_PAYSTACK_PENDING = "paystack_pending"; // Native JS popup waiting
const STEP_OFFLINE_PENDING = "offline_pending";

export default function Checkout({ paystack }) {
    const { checkout } = usePage().props;
    const {
        cart,
        loading: cartLoading,
        refreshCart,
        confirmPrices,
    } = useCart();
    const { formatMinorCurrency } = useCurrency();
    const [step, setStep] = useState(STEP_REVIEW);
    const [error, setError] = useState("");
    const [order, setOrder] = useState(null);
    const [statusText, setStatusText] = useState("");
    const [offlinePayment, setOfflinePayment] = useState(null);
    const [preview, setPreview] = useState({ mode: "cart", items: [], itemCount: 0, totalMinor: 0, currency: "" });
    const [previewLoading, setPreviewLoading] = useState(false);
    const [confirmingPrices, setConfirmingPrices] = useState(false);

    // Payment Selection State
    const [paymentMethod, setPaymentMethod] = useState("mpesa");
    const [phoneNumber, setPhoneNumber] = useState("");
    const isDirectMode = checkout?.mode === "direct" && !!checkout?.programId;
    const directProgramId = isDirectMode ? Number(checkout.programId) : null;
    const enrollmentIntentId = checkout?.enrollmentIntentId
        ? Number(checkout.enrollmentIntentId)
        : null;

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
    const availablePaymentMethods = isDirectMode
        ? preview?.availablePaymentMethods || []
        : cart?.availablePaymentMethods || [];
    const allowsPaystack = availablePaymentMethods.includes("paystack");
    const allowsOffline = availablePaymentMethods.includes("offline_bank_transfer");
    const isEmpty = isDirectMode
        ? !previewLoading && items.length === 0
        : !cartLoading && items.length === 0;
    const directProgramUrl = isDirectMode ? items[0]?.program?.publicUrl : "";
    const requiresPriceConfirmation = Boolean(
        !isDirectMode && cart?.requiresPriceConfirmation
    );
    const pricingError = !isDirectMode ? cart?.pricingError || "" : "";

    const handleConfirmPrices = useCallback(async () => {
        setConfirmingPrices(true);
        setError("");
        const res = await confirmPrices();
        if (!res.ok) {
            setError(res.message || "Unable to confirm current prices.");
        }
        setConfirmingPrices(false);
    }, [confirmPrices]);

    useEffect(() => {
        if (isEmpty || availablePaymentMethods.length === 0) {
            return;
        }
        if (!allowsPaystack && allowsOffline) {
            setPaymentMethod("offline_bank_transfer");
        } else if (!allowsOffline && paymentMethod === "offline_bank_transfer") {
            setPaymentMethod("mpesa");
        }
    }, [allowsOffline, allowsPaystack, availablePaymentMethods.length, isEmpty, paymentMethod]);

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

        if (requiresPriceConfirmation || pricingError) {
            setError(
                pricingError || "Review and confirm the updated course prices before paying."
            );
            return;
        }

        if (availablePaymentMethods.length === 0) {
            setError("This course is not configured for LMS payment.");
            return;
        }

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

        // 1. Create order from cart/direct checkout.
        const provider =
            paymentMethod === "offline_bank_transfer"
                ? "offline_bank_transfer"
                : "paystack";
        const orderRes = await commerceApi.createOrder(
            provider,
            isDirectMode ? [directProgramId] : null,
            isDirectMode ? enrollmentIntentId : null,
        );
        if (!orderRes.ok) {
            setError(orderRes.message || "Failed to create order.");
            if (!isDirectMode && orderRes.error === "price_confirmation_required") {
                refreshCart();
            }
            setStep(STEP_REVIEW);
            return;
        }

        const newOrder = orderRes.order;
        setOrder(newOrder);
        if (!isDirectMode) {
            refreshCart();
        }

        if (paymentMethod === "offline_bank_transfer") {
            setOfflinePayment(orderRes.offlinePayment || null);
            setStep(STEP_OFFLINE_PENDING);
            return;
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
    }, [
        availablePaymentMethods.length,
        getOrderPageUrl,
        handlePaid,
        isDirectMode,
        enrollmentIntentId,
        directProgramId,
        paystack,
        refreshCart,
        paymentMethod,
        phoneNumber,
        pricingError,
        requiresPriceConfirmation,
    ]);

    // Determine primary program ID for "Go to Course" after payment
    const primaryProgramId = order?.items?.[0]?.program?.id || order?.program?.id || null;

    return (
        <DashboardLayout role="student" breadcrumbs={[{ label: "Programs", href: "/programs/" }, { label: "Checkout" }]}>
            <Container maxWidth="md" sx={{ py: { xs: 2.5, md: 5 } }}>
                <Head title="Checkout" />

                {/* Back to programs */}
                {step === STEP_REVIEW && (
                    <Button
                        component={Link}
                        href={isDirectMode ? directProgramUrl : "/programs/"}
                        startIcon={<IconArrowLeft size={18} />}
                        disabled={isDirectMode && !directProgramUrl}
                        sx={{ mb: 2 }}
                    >
                        {isDirectMode ? "Back to Program" : "Browse More Programs"}
                    </Button>
                )}

                {step === STEP_REVIEW && (
                    <Box sx={{ mb: 3 }}>
                        <Typography
                            component="h1"
                            variant="h4"
                            fontWeight={750}
                            letterSpacing="-0.025em"
                        >
                            Complete your enrollment
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                            Choose how you would like to pay. Your payment is processed securely by Paystack.
                        </Typography>
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                        {error}
                    </Alert>
                )}

                {step === STEP_REVIEW && pricingError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {pricingError}
                    </Alert>
                )}

                {step === STEP_REVIEW && requiresPriceConfirmation && !pricingError && (
                    <Alert
                        severity="warning"
                        sx={{ mb: 2 }}
                        action={(
                            <Button
                                color="inherit"
                                size="small"
                                onClick={handleConfirmPrices}
                                disabled={confirmingPrices}
                            >
                                Confirm prices
                            </Button>
                        )}
                    >
                        Course pricing changed. Review the updated total before payment.
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

                {step === STEP_OFFLINE_PENDING && order && (
                    <OfflineInstructions
                        offlinePayment={offlinePayment}
                        orderReference={order.reference}
                    />
                )}

                {/* M-Pesa confirmation wait screen */}
                {step === STEP_MPESA_PENDING && order && (
                    <Card sx={{ borderRadius: 2, textAlign: "center", py: 4 }}>
                        <CardContent>
                            {order.status !== "paid" && (
                                <>
                                    <IconDeviceMobile size={48} color="#10B981" style={{ marginBottom: 16 }} />
                                    <Typography variant="h5" fontWeight={700} gutterBottom>
                                        Check your phone
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                                        {statusText}
                                    </Typography>
                                </>
                            )}
                            
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
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.45fr) minmax(280px, 0.8fr)" },
                            gap: 3,
                            alignItems: "start",
                        }}
                    >
                        {/* Order summary */}
                        <Card
                            variant="outlined"
                            sx={{
                                order: { xs: 0, md: 1 },
                                borderRadius: 3,
                                position: { md: "sticky" },
                                top: { md: 24 },
                                boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
                            }}
                        >
                            <CardContent>
                                <Typography variant="overline" color="text.secondary" fontWeight={700}>
                                    Your order
                                </Typography>
                                <Typography variant="h6" fontWeight={700} sx={{ mb: 2.25 }}>
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
                                                spacing={2}
                                                sx={{ py: 1 }}
                                            >
                                                <Typography variant="body2" fontWeight={600}>
                                                    {item.program?.name}
                                                </Typography>
                                                <Typography variant="body2" fontWeight={700} sx={{ whiteSpace: "nowrap" }}>
                                                    {formatMinorCurrency(item.amountMinor)}
                                                </Typography>
                                            </Stack>
                                        ))}
                                        <Divider sx={{ my: 1.5 }} />
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="subtitle1" fontWeight={700}>
                                                Total
                                            </Typography>
                                            <Typography variant="h6" fontWeight={800} color="primary.main">
                                                {formatMinorCurrency(totalMinor)}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2.5 }}>
                                            <IconLock size={15} />
                                            <Typography variant="caption" color="text.secondary">
                                                Secure payment powered by Paystack
                                            </Typography>
                                        </Stack>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment Method Selector */}
                        {!isEmpty && (
                            <Card
                                variant="outlined"
                                sx={{
                                    order: { xs: 1, md: 0 },
                                    borderRadius: 3,
                                    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
                                }}
                            >
                                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 }, "&:last-child": { pb: { xs: 2.5, sm: 3.5 } } }}>
                                    <Typography variant="h5" fontWeight={750} letterSpacing="-0.015em">
                                        Choose a payment method
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
                                        Select one of the secure payment options below.
                                    </Typography>
                                    {availablePaymentMethods.length === 0 && (
                                        <Alert severity="warning" sx={{ mb: 2 }}>
                                            This course is not configured for LMS payment.
                                        </Alert>
                                    )}
                                    <FormControl component="fieldset" fullWidth>
                                        <RadioGroup
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            sx={{ gap: 1.5 }}
                                        >
                                            {allowsPaystack && (
                                                <>
                                                    <Box
                                                        sx={{
                                                            border: "1px solid",
                                                            borderColor: paymentMethod === "mpesa" ? "primary.main" : "divider",
                                                            borderRadius: 2.5,
                                                            bgcolor: paymentMethod === "mpesa" ? "action.hover" : "background.paper",
                                                            transition: "border-color 180ms ease, background-color 180ms ease",
                                                        }}
                                                    >
                                                        <FormControlLabel
                                                            value="mpesa"
                                                            control={<Radio inputProps={{ "aria-label": "M-Pesa" }} />}
                                                            label={(
                                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                                    <Box
                                                                        sx={{
                                                                            width: 38,
                                                                            height: 38,
                                                                            borderRadius: 1.5,
                                                                            bgcolor: "#E9F8EF",
                                                                            color: "#087A3E",
                                                                            display: "grid",
                                                                            placeItems: "center",
                                                                        }}
                                                                    >
                                                                        <IconDeviceMobile size={20} />
                                                                    </Box>
                                                                    <Box>
                                                                        <Typography fontWeight={700}>M-Pesa</Typography>
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            Receive a payment prompt on your phone
                                                                        </Typography>
                                                                    </Box>
                                                                </Stack>
                                                            )}
                                                            sx={{ m: 0, px: 1.5, py: 1.25, width: "100%" }}
                                                        />
                                                        {paymentMethod === "mpesa" && (
                                                            <Box sx={{ px: 2, pb: 2 }}>
                                                            <TextField
                                                                fullWidth
                                                                id="mpesa-phone-number"
                                                                label="M-Pesa phone number"
                                                                placeholder="0712 345 678"
                                                                value={phoneNumber}
                                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                                helperText="Use the Safaricom number that will approve this payment."
                                                                slotProps={{
                                                                    htmlInput: {
                                                                        inputMode: "tel",
                                                                        autoComplete: "tel",
                                                                    },
                                                                }}
                                                            />
                                                            </Box>
                                                        )}
                                                    </Box>

                                                    <Box
                                                        sx={{
                                                            border: "1px solid",
                                                            borderColor: paymentMethod === "card" ? "primary.main" : "divider",
                                                            borderRadius: 2.5,
                                                            bgcolor: paymentMethod === "card" ? "action.hover" : "background.paper",
                                                            transition: "border-color 180ms ease, background-color 180ms ease",
                                                        }}
                                                    >
                                                        <FormControlLabel
                                                            value="card"
                                                            control={<Radio inputProps={{ "aria-label": "Credit or debit card" }} />}
                                                            label={(
                                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                                    <Box
                                                                        sx={{
                                                                            width: 38,
                                                                            height: 38,
                                                                            borderRadius: 1.5,
                                                                            bgcolor: "primary.50",
                                                                            color: "primary.main",
                                                                            display: "grid",
                                                                            placeItems: "center",
                                                                        }}
                                                                    >
                                                                        <IconCreditCard size={20} />
                                                                    </Box>
                                                                    <Box>
                                                                        <Typography fontWeight={700}>Credit or debit card</Typography>
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            Pay securely using your bank card
                                                                        </Typography>
                                                                    </Box>
                                                                </Stack>
                                                            )}
                                                            sx={{ m: 0, px: 1.5, py: 1.25, width: "100%" }}
                                                        />
                                                    </Box>
                                                </>
                                            )}

                                            {allowsOffline && (
                                                <Box
                                                    sx={{
                                                        border: "1px solid",
                                                        borderColor: paymentMethod === "offline_bank_transfer" ? "primary.main" : "divider",
                                                        borderRadius: 2.5,
                                                        bgcolor: paymentMethod === "offline_bank_transfer" ? "action.hover" : "background.paper",
                                                    }}
                                                >
                                                    <FormControlLabel
                                                        value="offline_bank_transfer"
                                                        control={<Radio inputProps={{ "aria-label": "Bank transfer" }} />}
                                                        label={(
                                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                                <IconBuildingBank size={22} />
                                                                <Box>
                                                                    <Typography fontWeight={700}>Bank transfer</Typography>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        Receive instructions after placing your order
                                                                    </Typography>
                                                                </Box>
                                                            </Stack>
                                                        )}
                                                        sx={{ m: 0, px: 1.5, py: 1.25, width: "100%" }}
                                                    />
                                                </Box>
                                            )}
                                        </RadioGroup>
                                    </FormControl>

                                    <Button
                                        variant="contained"
                                        fullWidth
                                        size="large"
                                        onClick={handlePlaceOrder}
                                        disabled={
                                            availablePaymentMethods.length === 0 ||
                                            requiresPriceConfirmation ||
                                            Boolean(pricingError)
                                        }
                                        sx={{ mt: 3, py: 1.5, fontWeight: 750, borderRadius: 2 }}
                                    >
                                        {paymentMethod === "mpesa"
                                            ? "Pay with M-Pesa"
                                            : paymentMethod === "offline_bank_transfer"
                                              ? "Continue with bank transfer"
                                              : "Pay with card"}
                                    </Button>
                                    {paymentMethod === "mpesa" && (
                                        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 1.5 }}>
                                            <IconLock size={15} style={{ marginTop: 2, flexShrink: 0 }} />
                                            <Typography variant="caption" color="text.secondary">
                                                You will receive a prompt on your phone to confirm
                                                {` ${formatMinorCurrency(totalMinor)}`}.
                                            </Typography>
                                        </Stack>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                )}
            </Container>
        </DashboardLayout>
    );
}
