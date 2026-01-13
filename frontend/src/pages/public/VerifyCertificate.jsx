import { Head, useForm } from "@inertiajs/react";
import {
    Box,
    Container,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    Stack,
    Divider,
    Chip,
    InputAdornment,
} from "@mui/material";
import {
    IconSearch,
    IconCertificate,
    IconCheck,
    IconX,
    IconCalendar,
    IconUser,
    IconSchool,
} from "@tabler/icons-react";
import { motion } from "framer-motion";

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

/**
 * Certificate Verification Page
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.6
 */
export default function VerifyCertificate({ result }) {
    const { data, setData, post, processing } = useForm({
        serial_number: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/verify-certificate/");
    };

    return (
        <>
            <Head title="Verify Certificate" />
            <Box
                sx={{
                    minHeight: "100vh",
                    bgcolor: "background.default",
                    py: { xs: 4, md: 8 },
                }}
            >
                <Container maxWidth="md">
                    <motion.div {...fadeInUp}>
                        {/* Header */}
                        <Box sx={{ textAlign: "center", mb: 6 }}>
                            <IconCertificate size={64} color="#3B82F6" />
                            <Typography variant="h3" fontWeight={700} sx={{ mt: 2 }}>
                                Certificate Verification
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                                Enter a certificate serial number to verify its authenticity
                            </Typography>
                        </Box>

                        {/* Search Form */}
                        <Card sx={{ mb: 4 }}>
                            <CardContent sx={{ p: 4 }}>
                                <form onSubmit={handleSubmit}>
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                        <TextField
                                            fullWidth
                                            label="Certificate Serial Number"
                                            placeholder="e.g., CERT-2024-001234"
                                            value={data.serial_number}
                                            onChange={(e) => setData("serial_number", e.target.value.toUpperCase())}
                                            autoFocus
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <IconSearch size={20} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            size="large"
                                            disabled={processing || !data.serial_number.trim()}
                                            sx={{ minWidth: 120, py: 1.8 }}
                                        >
                                            {processing ? "Verifying..." : "Verify"}
                                        </Button>
                                    </Stack>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Results */}
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {result.found ? (
                                    <CertificateDetails certificate={result.certificate} />
                                ) : (
                                    <CertificateNotFound />
                                )}
                            </motion.div>
                        )}

                        {/* Info */}
                        <Box sx={{ mt: 6, textAlign: "center" }}>
                            <Typography variant="body2" color="text.secondary">
                                This verification service is provided by Crossview LMS.
                                <br />
                                All verification attempts are logged for security purposes.
                            </Typography>
                        </Box>
                    </motion.div>
                </Container>
            </Box>
        </>
    );
}

/**
 * Certificate Details Component
 * Requirements: 5.2, 5.3
 */
function CertificateDetails({ certificate }) {
    const isRevoked = certificate.isRevoked;

    return (
        <Card
            sx={{
                borderLeft: 4,
                borderColor: isRevoked ? "error.main" : "success.main",
            }}
        >
            <CardContent sx={{ p: 4 }}>
                {/* Status Header */}
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    {isRevoked ? (
                        <>
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: "50%",
                                    bgcolor: "error.light",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <IconX size={24} color="#d32f2f" />
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight={600} color="error">
                                    Certificate Revoked
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    This certificate has been revoked and is no longer valid.
                                </Typography>
                            </Box>
                        </>
                    ) : (
                        <>
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: "50%",
                                    bgcolor: "success.light",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <IconCheck size={24} color="#2e7d32" />
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight={600} color="success.main">
                                    Certificate Valid
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    This certificate is authentic and valid.
                                </Typography>
                            </Box>
                        </>
                    )}
                </Stack>

                <Divider sx={{ my: 3 }} />

                {/* Certificate Details */}
                <Stack spacing={3}>
                    <DetailRow
                        icon={<IconCertificate size={20} />}
                        label="Serial Number"
                        value={certificate.serialNumber}
                    />
                    <DetailRow
                        icon={<IconUser size={20} />}
                        label="Student Name"
                        value={certificate.studentName}
                    />
                    <DetailRow
                        icon={<IconSchool size={20} />}
                        label="Program"
                        value={certificate.programTitle}
                    />
                    <DetailRow
                        icon={<IconCalendar size={20} />}
                        label="Completion Date"
                        value={formatDate(certificate.completionDate)}
                    />
                    <DetailRow
                        icon={<IconCalendar size={20} />}
                        label="Issue Date"
                        value={formatDate(certificate.issueDate)}
                    />
                    {isRevoked && certificate.revokedAt && (
                        <DetailRow
                            icon={<IconX size={20} />}
                            label="Revoked On"
                            value={formatDate(certificate.revokedAt)}
                            valueColor="error.main"
                        />
                    )}
                </Stack>

                {/* Status Chip */}
                <Box sx={{ mt: 3 }}>
                    <Chip
                        label={isRevoked ? "REVOKED" : "VALID"}
                        color={isRevoked ? "error" : "success"}
                        size="small"
                    />
                </Box>
            </CardContent>
        </Card>
    );
}

/**
 * Certificate Not Found Component
 */
function CertificateNotFound() {
    return (
        <Card sx={{ borderLeft: 4, borderColor: "warning.main" }}>
            <CardContent sx={{ p: 4 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: "50%",
                            bgcolor: "warning.light",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <IconSearch size={24} color="#ed6c02" />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={600}>
                            Certificate Not Found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            No certificate was found with this serial number.
                            Please check the number and try again.
                        </Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

/**
 * Detail Row Component
 */
function DetailRow({ icon, label, value, valueColor = "text.primary" }) {
    return (
        <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box sx={{ color: "text.secondary", mt: 0.5 }}>{icon}</Box>
            <Box>
                <Typography variant="caption" color="text.secondary">
                    {label}
                </Typography>
                <Typography variant="body1" fontWeight={500} color={valueColor}>
                    {value}
                </Typography>
            </Box>
        </Stack>
    );
}

/**
 * Format date string
 */
function formatDate(dateString) {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}
