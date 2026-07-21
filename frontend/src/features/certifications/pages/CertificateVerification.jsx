import { Head, Link, useForm, usePage } from "@inertiajs/react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Divider,
    Grid,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    IconCertificate,
    IconCircleCheck,
    IconExternalLink,
    IconSearch,
    IconShieldX,
} from "@tabler/icons-react";
import PlatformLogo from "@/components/common/PlatformLogo";

const formatDate = (value) => {
    if (!value) return "Not available";
    return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(new Date(value));
};

const resultPresentation = {
    valid: {
        severity: "success",
        eyebrow: "Authenticity confirmed",
        title: "This certificate is valid",
        description:
            "The certificate details below match an issued record on this platform.",
        icon: IconCircleCheck,
    },
    revoked: {
        severity: "error",
        eyebrow: "Certificate revoked",
        title: "This certificate is no longer valid",
        description:
            "The certificate was issued previously but has since been revoked.",
        icon: IconShieldX,
    },
    not_found: {
        severity: "warning",
        eyebrow: "No matching record",
        title: "Certificate not found",
        description:
            "Check the serial number and try again. A missing record must not be treated as a valid certificate.",
        icon: IconSearch,
    },
};

const CertificateDetails = ({ certificate }) => {
    const details = [
        ["Learner", certificate.studentName],
        ["Course", certificate.programTitle],
        ["Completed", formatDate(certificate.completionDate)],
        ["Issued", formatDate(certificate.issueDate)],
    ];

    return (
        <Grid container spacing={0} sx={{ mt: 1 }}>
            {details.map(([label, value]) => (
                <Grid key={label} size={{ xs: 12, sm: 6 }}>
                    <Box
                        sx={{
                            py: 2.25,
                            pr: 2,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                        }}
                    >
                        <Typography
                            variant="overline"
                            color="text.secondary"
                            sx={{ letterSpacing: "0.12em" }}
                        >
                            {label}
                        </Typography>
                        <Typography variant="body1" fontWeight={700}>
                            {value || "Not available"}
                        </Typography>
                    </Box>
                </Grid>
            ))}
        </Grid>
    );
};

export default function CertificateVerification({
    serialNumber = "",
    result = null,
    certificate = null,
}) {
    const { platform } = usePage().props;
    const institutionName = platform?.institutionName || "LMS";
    const { data, setData, post, processing, errors } = useForm({
        serial_number: serialNumber,
    });
    const presentation = resultPresentation[result];
    const ResultIcon = presentation?.icon;

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!data.serial_number.trim()) return;
        post("/verify-certificate/", { preserveScroll: true });
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "#f4f1e9",
                backgroundImage:
                    "radial-gradient(circle at 12% 18%, rgba(37, 99, 235, 0.10), transparent 28%), radial-gradient(circle at 88% 80%, rgba(15, 118, 110, 0.09), transparent 30%)",
            }}
        >
            <Head title="Verify a certificate" />

            <Box
                component="header"
                sx={{
                    borderBottom: "1px solid",
                    borderColor: "rgba(15, 23, 42, 0.10)",
                    bgcolor: "rgba(255, 255, 255, 0.78)",
                    backdropFilter: "blur(14px)",
                }}
            >
                <Container maxWidth="lg">
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ minHeight: 76 }}
                    >
                        <PlatformLogo
                            platform={platform}
                            href="/"
                            showName
                            showNameWhenLogo
                            fallbackName={institutionName}
                        />
                        <Button component={Link} href="/" color="inherit">
                            Return home
                        </Button>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
                <Stack spacing={4}>
                    <Box sx={{ maxWidth: 700 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <IconCertificate size={30} />
                            <Typography
                                variant="overline"
                                fontWeight={800}
                                sx={{ letterSpacing: "0.16em" }}
                            >
                                Public credential check
                            </Typography>
                        </Stack>
                        <Typography
                            component="h1"
                            variant="h2"
                            sx={{
                                mt: 2,
                                fontSize: { xs: "2.4rem", md: "4rem" },
                                lineHeight: 1.02,
                                letterSpacing: "-0.045em",
                            }}
                        >
                            Verify a certificate.
                        </Typography>
                        <Typography
                            variant="h6"
                            color="text.secondary"
                            sx={{ mt: 2, maxWidth: 620, fontWeight: 400 }}
                        >
                            Enter the serial number printed on the certificate to
                            confirm its current status and issued details.
                        </Typography>
                    </Box>

                    <Card
                        elevation={0}
                        sx={{
                            border: "1px solid",
                            borderColor: "rgba(15, 23, 42, 0.12)",
                            borderRadius: 3,
                            bgcolor: "rgba(255, 255, 255, 0.92)",
                            boxShadow: "0 24px 80px rgba(15, 23, 42, 0.10)",
                        }}
                    >
                        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                            <Box component="form" onSubmit={handleSubmit}>
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1.5}
                                    alignItems="flex-start"
                                >
                                    <TextField
                                        label="Certificate serial number"
                                        value={data.serial_number}
                                        onChange={(event) =>
                                            setData(
                                                "serial_number",
                                                event.target.value.toUpperCase(),
                                            )
                                        }
                                        placeholder="Enter the number exactly as printed"
                                        autoComplete="off"
                                        error={Boolean(errors.serial_number)}
                                        helperText={errors.serial_number}
                                        fullWidth
                                        required
                                        slotProps={{
                                            htmlInput: { maxLength: 80 },
                                        }}
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        startIcon={<IconSearch size={19} />}
                                        disabled={
                                            processing ||
                                            !data.serial_number.trim()
                                        }
                                        sx={{ minHeight: 56, minWidth: 150 }}
                                    >
                                        {processing ? "Checking…" : "Verify"}
                                    </Button>
                                </Stack>
                            </Box>

                            {presentation && (
                                <>
                                    <Divider sx={{ my: 4 }} />
                                    <Alert
                                        severity={presentation.severity}
                                        icon={
                                            ResultIcon ? (
                                                <ResultIcon size={26} />
                                            ) : undefined
                                        }
                                        sx={{ alignItems: "flex-start" }}
                                    >
                                        <Typography
                                            variant="overline"
                                            fontWeight={800}
                                            sx={{ letterSpacing: "0.11em" }}
                                        >
                                            {presentation.eyebrow}
                                        </Typography>
                                        <Typography variant="h5" fontWeight={800}>
                                            {presentation.title}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                                            {presentation.description}
                                        </Typography>
                                    </Alert>

                                    {certificate && (
                                        <Box sx={{ mt: 3 }}>
                                            <Stack
                                                direction={{ xs: "column", sm: "row" }}
                                                justifyContent="space-between"
                                                spacing={1}
                                            >
                                                <Box>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        Certificate serial
                                                    </Typography>
                                                    <Typography
                                                        variant="h6"
                                                        fontWeight={800}
                                                        sx={{ wordBreak: "break-word" }}
                                                    >
                                                        {certificate.serialNumber}
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    component="a"
                                                    href={`/verify/${encodeURIComponent(
                                                        certificate.serialNumber,
                                                    )}/`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    endIcon={<IconExternalLink size={17} />}
                                                >
                                                    Share result
                                                </Button>
                                            </Stack>
                                            <CertificateDetails
                                                certificate={certificate}
                                            />
                                            {result === "revoked" &&
                                                certificate.revocationReason && (
                                                    <Alert severity="error" sx={{ mt: 3 }}>
                                                        {certificate.revocationReason}
                                                    </Alert>
                                                )}
                                        </Box>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                    >
                        Verification confirms only the record held by {institutionName} at
                        the time of this check.
                    </Typography>
                </Stack>
            </Container>
        </Box>
    );
}
