import { useState } from "react";
import { useForm } from "@inertiajs/react";
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    FormControlLabel,
    Checkbox,
    Link,
    Alert,
    InputAdornment,
    IconButton,
} from "@mui/material";
import { IconEye, IconEyeOff, IconMail, IconLock } from "@tabler/icons-react";

/**
 * Login Page - Authentication form
 */
export default function Login() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/login");
    };

    const hasError = Object.keys(errors).length > 0;

    return (
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
            <Card sx={{ maxWidth: 440, width: "100%" }}>
                <CardContent sx={{ p: 4 }}>
                    {/* Logo and Welcome */}
                    <Box sx={{ textAlign: "center", mb: 4 }}>
                        <Typography
                            variant="h4"
                            color="primary"
                            fontWeight={700}
                            gutterBottom
                        >
                            Crossview LMS
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Welcome back! Please sign in to continue.
                        </Typography>
                    </Box>

                    {/* Error Alert */}
                    {hasError && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            Invalid credentials. Please check your email and
                            password.
                        </Alert>
                    )}

                    {/* Login Form */}
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

                        <TextField
                            fullWidth
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            value={data.password}
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                            error={!!errors.password}
                            helperText={errors.password}
                            margin="normal"
                            autoComplete="current-password"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <IconLock size={20} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            edge="end"
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                        >
                                            {showPassword ? (
                                                <IconEyeOff size={20} />
                                            ) : (
                                                <IconEye size={20} />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mt: 1,
                                mb: 3,
                            }}
                        >
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={data.remember}
                                        onChange={(e) =>
                                            setData(
                                                "remember",
                                                e.target.checked
                                            )
                                        }
                                        size="small"
                                    />
                                }
                                label={
                                    <Typography variant="body2">
                                        Remember me
                                    </Typography>
                                }
                            />
                            <Link
                                href="/forgot-password"
                                variant="body2"
                                underline="hover"
                            >
                                Forgot password?
                            </Link>
                        </Box>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={processing}
                            sx={{ py: 1.5 }}
                        >
                            {processing ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
}
