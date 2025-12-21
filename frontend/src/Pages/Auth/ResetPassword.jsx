import { useState } from "react";
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
    IconButton,
    LinearProgress,
} from "@mui/material";
import { IconEye, IconEyeOff, IconLock } from "@tabler/icons-react";
import { motion } from "framer-motion";

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

/**
 * Reset Password Page - Set new password with token
 * Requirements: 4.3, 4.4, 4.5
 */
export default function ResetPassword({ tokenValid, errors = {} }) {
    const { tenant } = usePage().props;
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, post, processing } = useForm({
        password: "",
        password_confirm: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(window.location.pathname); // POST to same URL with token
    };

    // Calculate password strength
    const passwordStrength = calculatePasswordStrength(data.password);

    // Invalid token state
    if (!tokenValid) {
        return (
            <>
                <Head title="Invalid Reset Link" />
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
                            <CardContent sx={{ p: 4, textAlign: "center" }}>
                                <Typography variant="h5" fontWeight={600} color="error" gutterBottom>
                                    Invalid or Expired Link
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                    This password reset link is invalid or has expired.
                                    Please request a new one.
                                </Typography>
                                <Button
                                    component={Link}
                                    href="/forgot-password/"
                                    variant="contained"
                                >
                                    Request New Link
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Box>
            </>
        );
    }

    return (
        <>
            <Head title="Reset Password" />
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
                                    Reset Password
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Enter your new password below.
                                </Typography>
                            </Box>

                            {/* Error Alert */}
                            {errors.token && (
                                <Alert severity="error" sx={{ mb: 3 }}>
                                    {errors.token}
                                </Alert>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit}>
                                <TextField
                                    fullWidth
                                    label="New Password"
                                    type={showPassword ? "text" : "password"}
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                    error={!!errors.password}
                                    helperText={errors.password}
                                    margin="normal"
                                    autoComplete="new-password"
                                    autoFocus
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <IconLock size={20} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                {/* Password Strength Indicator */}
                                {data.password && (
                                    <Box sx={{ mt: 1, mb: 2 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={passwordStrength.score}
                                            color={passwordStrength.color}
                                            sx={{ height: 6, borderRadius: 3 }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            {passwordStrength.label}
                                        </Typography>
                                    </Box>
                                )}

                                <TextField
                                    fullWidth
                                    label="Confirm New Password"
                                    type={showConfirm ? "text" : "password"}
                                    value={data.password_confirm}
                                    onChange={(e) => setData("password_confirm", e.target.value)}
                                    error={!!errors.password_confirm}
                                    helperText={errors.password_confirm}
                                    margin="normal"
                                    autoComplete="new-password"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <IconLock size={20} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowConfirm(!showConfirm)}
                                                    edge="end"
                                                    aria-label={showConfirm ? "Hide password" : "Show password"}
                                                >
                                                    {showConfirm ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                {/* Password Requirements */}
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, mb: 3 }}>
                                    Password must be at least 8 characters with uppercase, lowercase, and a number.
                                </Typography>

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    disabled={processing}
                                    sx={{ py: 1.5 }}
                                >
                                    {processing ? "Resetting..." : "Reset Password"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </Box>
        </>
    );
}

/**
 * Calculate password strength for visual indicator
 */
function calculatePasswordStrength(password) {
    if (!password) return { score: 0, label: "", color: "error" };

    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;

    if (score < 40) return { score, label: "Weak", color: "error" };
    if (score < 70) return { score, label: "Fair", color: "warning" };
    if (score < 90) return { score, label: "Good", color: "info" };
    return { score: 100, label: "Strong", color: "success" };
}
