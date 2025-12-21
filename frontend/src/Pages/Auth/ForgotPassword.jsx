import { Head, Link, useForm, usePage } from "@inertiajs/react";
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    InputAdornment,
} from "@mui/material";
import { IconMail, IconArrowLeft } from "@tabler/icons-react";
import { motion } from "framer-motion";

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

/**
 * Forgot Password Page - Request password reset email
 * Requirements: 4.1, 4.2
 */
export default function ForgotPassword({ success, errors = {} }) {
    const { tenant } = usePage().props;

    const { data, setData, post, processing } = useForm({
        email: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/forgot-password/");
    };

    return (
        <>
            <Head title="Forgot Password" />
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "background.default",
                    px: 2,
                }}
            >
                <motion.div {...fadeInUp}>
                    <Card sx={{ maxWidth: 440, width: "100%" }}>
                        <CardContent sx={{ p: 4 }}>
                            {/* Header */}
                            <Box sx={{ textAlign: "center", mb: 4 }}>
                                {tenant?.logoUrl && (
                                    <Box
                                        component="img"
                                        src={tenant.logoUrl}
                                        alt={tenant.institutionName}
                                        sx={{ height: 48, mb: 2 }}
                                    />
                                )}
                                <Typography
                                    variant="h4"
                                    color="primary"
                                    fontWeight={700}
                                    gutterBottom
                                >
                                    Forgot Password?
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Enter your email and we'll send you a reset link.
                                </Typography>
                            </Box>

                            {/* Success Message */}
                            {success && (
                                <Alert severity="success" sx={{ mb: 3 }}>
                                    {success}
                                </Alert>
                            )}

                            {/* Error Alert */}
                            {errors.email && (
                                <Alert severity="error" sx={{ mb: 3 }}>
                                    {errors.email}
                                </Alert>
                            )}

                            {/* Form */}
                            {!success ? (
                                <form onSubmit={handleSubmit}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData("email", e.target.value)}
                                        error={!!errors.email}
                                        helperText={errors.email}
                                        margin="normal"
                                        autoComplete="email"
                                        autoFocus
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <IconMail size={20} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        disabled={processing}
                                        sx={{ py: 1.5, mt: 3, mb: 2 }}
                                    >
                                        {processing ? "Sending..." : "Send Reset Link"}
                                    </Button>
                                </form>
                            ) : (
                                <Button
                                    component={Link}
                                    href="/login/"
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    sx={{ py: 1.5, mb: 2 }}
                                >
                                    Back to Login
                                </Button>
                            )}

                            {/* Back to Login */}
                            {!success && (
                                <Box sx={{ textAlign: "center" }}>
                                    <Link
                                        href="/login/"
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 4,
                                            color: "inherit",
                                            textDecoration: "none",
                                        }}
                                    >
                                        <IconArrowLeft size={16} />
                                        <Typography variant="body2">Back to Login</Typography>
                                    </Link>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </Box>
        </>
    );
}
