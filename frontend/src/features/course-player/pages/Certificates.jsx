/**
 * Certificates Page
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { Head } from "@inertiajs/react";
import {
    Box,
    Card,
    CardContent,
    Stack,
    Typography,
    Alert,
    Button,
    Chip,
    IconButton,
    Tooltip,
} from "@mui/material";
import {
    Download as DownloadIcon,
    Share as ShareIcon,
    Verified as VerifiedIcon,
    Warning as WarningIcon,
    HourglassEmpty as PendingIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import DashboardLayout from "@/layouts/DashboardLayout";

const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

function CertificateCard({ certificate }) {
    const isPendingRelease = certificate.queueStatus === "pending";
    const isIneligible = certificate.queueStatus === "ineligible";
    const isIssued = Boolean(certificate.issueDate);

    // Download URL is now passed directly from backend as certificate.downloadUrl
    const handleDownload = () => {
        if (certificate.downloadUrl && isIssued) {
            window.open(certificate.downloadUrl, "_blank");
        }
    };

    const handleShare = () => {
        if (!certificate.verificationUrl) {
            return;
        }
        const url = `${window.location.origin}${certificate.verificationUrl}`;
        if (navigator.share) {
            navigator.share({
                title: `Certificate - ${certificate.programTitle}`,
                text: `Verify my certificate: ${certificate.studentName} - ${certificate.programTitle}`,
                url: url,
            });
        } else {
            navigator.clipboard.writeText(url);
            alert("Verification link copied to clipboard!");
        }
    };

    return (
        <motion.div {...fadeIn}>
            <Card
                sx={{
                    mb: 2,
                    borderLeft: certificate.isRevoked ? "4px solid" : "none",
                    borderColor: "error.main",
                    opacity: certificate.isRevoked ? 0.7 : 1,
                }}
            >
                <CardContent>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                        }}
                    >
                        <Box sx={{ flex: 1 }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 1,
                                }}
                            >
                                {certificate.isRevoked ? (
                                    <WarningIcon color="error" />
                                ) : isPendingRelease ? (
                                    <PendingIcon color="warning" />
                                ) : (
                                    <VerifiedIcon color="success" />
                                )}
                                <Typography variant="h6" component="h3">
                                    {certificate.programTitle}
                                </Typography>
                                {certificate.isRevoked && (
                                    <Chip
                                        label="Revoked"
                                        color="error"
                                        size="small"
                                    />
                                )}
                                {isPendingRelease && (
                                    <Chip
                                        label="Pending Release"
                                        color="warning"
                                        size="small"
                                    />
                                )}
                                {isIneligible && (
                                    <Chip
                                        label="Not Eligible"
                                        color="default"
                                        size="small"
                                        variant="outlined"
                                    />
                                )}
                            </Box>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                gutterBottom
                            >
                                Awarded to: {certificate.studentName}
                            </Typography>

                            <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
                                <Box>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Serial Number
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        fontFamily="monospace"
                                    >
                                        {certificate.serialNumber || "Pending release"}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Completion Date
                                    </Typography>
                                    <Typography variant="body2">
                                        {certificate.completionDate
                                            ? new Date(
                                                  certificate.completionDate,
                                              ).toLocaleDateString()
                                            : "-"}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Issue Date
                                    </Typography>
                                    <Typography variant="body2">
                                        {certificate.issueDate
                                            ? new Date(
                                                  certificate.issueDate,
                                              ).toLocaleDateString()
                                            : "Not issued yet"}
                                    </Typography>
                                </Box>
                            </Stack>

                            {certificate.isRevoked &&
                                certificate.revocationReason && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        Revocation reason:{" "}
                                        {certificate.revocationReason}
                                    </Alert>
                                )}

                            {isPendingRelease && (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    You have completed this program. Your certificate is
                                    pending admin approval for release.
                                </Alert>
                            )}

                            {isIneligible && (
                                <Alert severity="warning" sx={{ mt: 2 }}>
                                    Certificate requirements are not yet met for this
                                    program.
                                </Alert>
                            )}
                        </Box>

                        <Stack direction="row" spacing={1}>
                            <Tooltip title="Share verification link">
                                <IconButton
                                    onClick={handleShare}
                                    disabled={!certificate.verificationUrl}
                                >
                                    <ShareIcon />
                                </IconButton>
                            </Tooltip>
                            {!certificate.isRevoked && isIssued && (
                                <Tooltip title="Download PDF">
                                    <IconButton
                                        onClick={handleDownload}
                                        color="primary"
                                    >
                                        <DownloadIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Stack>
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function Certificates({ certificates }) {
    return (
        <DashboardLayout role="student">
            <Head title="My Certificates" />

            <Stack spacing={3}>
                <motion.div {...fadeIn}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        My Certificates
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        View, download, and share your earned certificates
                    </Typography>
                </motion.div>

                {certificates.length === 0 ? (
                    <motion.div {...fadeIn}>
                        <Alert severity="info" icon={<VerifiedIcon />}>
                            You haven't earned any certificates yet. Complete a
                            program to receive your certificate!
                        </Alert>
                    </motion.div>
                ) : (
                    certificates.map((certificate) => (
                        <CertificateCard
                            key={certificate.id}
                            certificate={certificate}
                        />
                    ))
                )}
            </Stack>
        </DashboardLayout>
    );
}
