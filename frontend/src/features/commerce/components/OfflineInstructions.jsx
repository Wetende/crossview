/**
 * OfflineInstructions — Bank transfer details display.
 * Shows account info, reference number, and copy-to-clipboard helpers.
 */
import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import { IconCopy, IconCheck } from "@tabler/icons-react";
import { Link } from "@inertiajs/react";

function CopyField({ label, value }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback: do nothing
        }
    };

    return (
        <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ py: 0.75 }}
        >
            <Box>
                <Typography variant="caption" color="text.secondary">
                    {label}
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                    {value || "—"}
                </Typography>
            </Box>
            {value && (
                <Tooltip title={copied ? "Copied!" : "Copy"}>
                    <IconButton size="small" onClick={handleCopy}>
                        {copied ? (
                            <IconCheck size={16} color="green" />
                        ) : (
                            <IconCopy size={16} />
                        )}
                    </IconButton>
                </Tooltip>
            )}
        </Stack>
    );
}

export default function OfflineInstructions({ offlinePayment, orderReference }) {
    const bankDetails = offlinePayment?.bankDetails || {};
    const instructions = offlinePayment?.instructions || "";

    return (
        <Stack spacing={3}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
                Your order has been placed. Please complete a bank transfer to the
                account below and we'll activate your access once the payment is
                confirmed by our team.
            </Alert>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                        Bank Transfer Details
                    </Typography>

                    {bankDetails.bankName && (
                        <CopyField label="Bank Name" value={bankDetails.bankName} />
                    )}
                    {bankDetails.accountNumber && (
                        <CopyField label="Account Number" value={bankDetails.accountNumber} />
                    )}
                    {bankDetails.accountName && (
                        <CopyField label="Account Name" value={bankDetails.accountName} />
                    )}
                    {bankDetails.branchCode && (
                        <CopyField label="Branch Code" value={bankDetails.branchCode} />
                    )}

                    <Divider sx={{ my: 1.5 }} />

                    <CopyField label="Payment Reference" value={orderReference} />

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                        Please include this reference in your transfer description
                        so we can match your payment.
                    </Typography>
                </CardContent>
            </Card>

            {instructions && (
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                            Additional Instructions
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ whiteSpace: "pre-wrap" }}
                        >
                            {instructions}
                        </Typography>
                    </CardContent>
                </Card>
            )}

            <Button component={Link} href="/student/orders/" variant="contained" fullWidth>
                View My Orders
            </Button>
        </Stack>
    );
}
