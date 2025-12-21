import { useState } from "react";
import PropTypes from "prop-types";
import {
    TextField,
    Button,
    Stack,
    InputAdornment,
    IconButton,
    LinearProgress,
    Typography,
    Box,
} from "@mui/material";
import {
    IconEye,
    IconEyeOff,
    IconMail,
    IconLock,
    IconUser,
} from "@tabler/icons-react";

/**
 * Reusable AuthForm component for authentication pages.
 * Supports login, register, forgot-password, and reset-password modes.
 * Requirements: 2.1, 3.1
 */
export default function AuthForm({
    mode = "login",
    data,
    setData,
    errors = {},
    processing = false,
    onSubmit,
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit?.(e);
    };

    // Calculate password strength for register/reset modes
    const passwordStrength = calculatePasswordStrength(data.password || "");

    return (
        <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
                {/* Name fields (register only) */}
                {mode === "register" && (
                    <Stack direction="row" spacing={2}>
                        <TextField
                            fullWidth
                            label="First Name"
                            value={data.first_name || ""}
                            onChange={(e) => setData("first_name", e.target.value)}
                            error={!!errors.first_name}
                            helperText={errors.first_name}
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
                            value={data.last_name || ""}
                            onChange={(e) => setData("last_name", e.target.value)}
                            error={!!errors.last_name}
                            helperText={errors.last_name}
                        />
                    </Stack>
                )}

                {/* Email field (login, register, forgot-password) */}
                {["login", "register", "forgot-password"].includes(mode) && (
                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={data.email || ""}
                        onChange={(e) => setData("email", e.target.value)}
                        error={!!errors.email}
                        helperText={errors.email}
                        autoComplete="email"
                        autoFocus={mode !== "register"}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <IconMail size={20} />
                                </InputAdornment>
                            ),
                        }}
                    />
                )}

                {/* Password field (login, register, reset-password) */}
                {["login", "register", "reset-password"].includes(mode) && (
                    <>
                        <TextField
                            fullWidth
                            label={mode === "reset-password" ? "New Password" : "Password"}
                            type={showPassword ? "text" : "password"}
                            value={data.password || ""}
                            onChange={(e) => setData("password", e.target.value)}
                            error={!!errors.password}
                            helperText={errors.password}
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                            autoFocus={mode === "reset-password"}
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

                        {/* Password strength indicator (register, reset-password) */}
                        {["register", "reset-password"].includes(mode) && data.password && (
                            <Box>
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
                    </>
                )}

                {/* Confirm password field (register, reset-password) */}
                {["register", "reset-password"].includes(mode) && (
                    <>
                        <TextField
                            fullWidth
                            label="Confirm Password"
                            type={showConfirm ? "text" : "password"}
                            value={data.password_confirm || ""}
                            onChange={(e) => setData("password_confirm", e.target.value)}
                            error={!!errors.password_confirm}
                            helperText={errors.password_confirm}
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

                        {/* Password requirements hint */}
                        <Typography variant="caption" color="text.secondary">
                            Password must be at least 8 characters with uppercase, lowercase, and a number.
                        </Typography>
                    </>
                )}

                {/* Submit button */}
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={processing}
                    sx={{ py: 1.5, mt: 1 }}
                >
                    {processing ? getProcessingText(mode) : getButtonText(mode)}
                </Button>
            </Stack>
        </form>
    );
}

AuthForm.propTypes = {
    mode: PropTypes.oneOf(["login", "register", "forgot-password", "reset-password"]),
    data: PropTypes.object.isRequired,
    setData: PropTypes.func.isRequired,
    errors: PropTypes.object,
    processing: PropTypes.bool,
    onSubmit: PropTypes.func,
};

/**
 * Get button text based on mode
 */
function getButtonText(mode) {
    const texts = {
        login: "Sign In",
        register: "Create Account",
        "forgot-password": "Send Reset Link",
        "reset-password": "Reset Password",
    };
    return texts[mode] || "Submit";
}

/**
 * Get processing text based on mode
 */
function getProcessingText(mode) {
    const texts = {
        login: "Signing in...",
        register: "Creating Account...",
        "forgot-password": "Sending...",
        "reset-password": "Resetting...",
    };
    return texts[mode] || "Processing...";
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
