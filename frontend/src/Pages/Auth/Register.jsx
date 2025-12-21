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
    Stack,
    LinearProgress,
} from "@mui/material";
import {
    IconEye,
    IconEyeOff,
    IconMail,
    IconLock,
    IconUser,
} from "@tabler/icons-react";
import { motion } from "framer-motion";

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

/**
 * Register Page - Student self-registration
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
export default function Register({ registrationEnabled, errors = {} }) {
    const { tenant } = usePage().props;
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, post, processing } = useForm({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        password_confirm: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/register/");
    };

    // Calculate password strength
    const passwordStrength = calculatePasswordStrength(data.password);

    // Registration disabled state (Requirement: 3.5)
    if (!registrationEnabled) {
        return (
            <>
                <Head title="Registration Closed" />
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
                                <Typography variant="h5" fontWeight={600} gutterBottom>
                                    Registration Closed
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                    Self-registration is currently disabled for this institution.
                                    Please contact your administrator for access.
                                </Typography>
                                <Button
                                    component={Link}
                                    href="/login/"
                                    variant="contained"
                                >
                                    Back to Login
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
            <Head title="Create Account" />
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "background.default",
                    px: 2,
                    py: 4,
                }}
            >
                <motion.div {...fadeInUp}>
                    <Card sx={{ maxWidth: 480, width: "100%" }}>
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
                                    {tenant?.institutionName || "Crossview LMS"}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Create your student account
                                </Typography>
                            </Box>

                            {/* Error Alert */}
                            {errors.auth && (
                                <Alert severity="error" sx={{ mb: 3 }}>
                                    {errors.auth}
                                </Alert>
                            )}

                            {/* Registration Form */}
                            <form onSubmit={handleSubmit}>
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        fullWidth
                                        label="First Name"
                                        value={data.first_name}
                                        onChange={(e) => setData("first_name", e.target.value)}
                                        error={!!errors.first_name}
                                        helperText={errors.first_name}
                                        margin="normal"
                                        autoFocus
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <IconUser size={20} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Last Name"
                                        value={data.last_name}
                                        onChange={(e) => setData("last_name", e.target.value)}
                                        error={!!errors.last_name}
                                        helperText={errors.last_name}
                                        margin="normal"
                                    />
                                </Stack>

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
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <IconMail size={20} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                    error={!!errors.password}
                                    helperText={errors.password}
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
                                    label="Confirm Password"
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
                                    sx={{ py: 1.5, mb: 2 }}
                                >
                                    {processing ? "Creating Account..." : "Create Account"}
                                </Button>

                                <Typography variant="body2" textAlign="center" color="text.secondary">
                                    Already have an account?{" "}
                                    <Link href="/login/" style={{ color: "inherit", fontWeight: 600 }}>
                                        Sign In
                                    </Link>
                                </Typography>
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
