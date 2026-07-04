import { useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    FormControlLabel,
    Checkbox,
    Alert,
    InputAdornment,
    IconButton,
    Divider,
} from "@mui/material";
import { IconEye, IconEyeOff, IconMail, IconLock } from "@tabler/icons-react";
import { motion } from "framer-motion";
import PlatformLogo from "@/components/common/PlatformLogo";

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

/**
 * Login Page - Authentication form
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
export default function Login({
    registrationEnabled = true,
    errors = {},
    socialAuth = {},
    nextUrl = "",
}) {
    const { platform } = usePage().props;
    const institutionName = platform?.institutionName || "LMS";
    const [showPassword, setShowPassword] = useState(false);
    const isEnrollmentFlow = nextUrl.startsWith("/programs/enrollment/resume/");
    const registerUrl = nextUrl
        ? `/register/?${new URLSearchParams({ next: nextUrl }).toString()}`
        : "/register/";

    const { data, setData, post, processing } = useForm({
        email: "",
        password: "",
        remember: false,
        next: nextUrl,
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        post("/login/", {
            onError: (errors) => {
                console.error("Login failed:", errors);
            }
        });
    };

    const hasError = errors.auth || Object.keys(errors).length > 0;

    return (
        <>
            <Head title="Sign In">
                {socialAuth.google?.enabled && (
                    <script src="https://accounts.google.com/gsi/client" async defer />
                )}
            </Head>
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
                            {/* Logo and Welcome */}
                            <Box sx={{ textAlign: "center", mb: 4 }}>
                                <PlatformLogo
                                    platform={platform}
                                    showName={false}
                                    logoHeight={48}
                                    logoMaxWidth={180}
                                    sx={{ mb: 2 }}
                                />
                                <Typography
                                    variant="h4"
                                    color="primary"
                                    fontWeight={700}
                                    gutterBottom
                                >
                                    {institutionName}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    {isEnrollmentFlow
                                        ? "Sign in with Google to continue your enrollment."
                                        : "Welcome back! Please sign in to continue."}
                                </Typography>
                            </Box>

                            {/* Error Alert - Same message for security (Requirement: 2.3) */}
                            {hasError && (
                                <Alert severity="error" sx={{ mb: 3 }}>
                                    {errors.auth || "Invalid email or password"}
                                </Alert>
                            )}

                            {socialAuth.google?.enabled && (
                                <>
                                    <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                                        <div
                                            id="g_id_onload"
                                            data-client_id={socialAuth.google.clientId}
                                            data-login_uri={socialAuth.google.loginUrl}
                                            data-next={nextUrl || undefined}
                                            data-context="signin"
                                            data-ux_mode="popup"
                                            data-auto_prompt="true"
                                        />
                                        <div
                                            className="g_id_signin"
                                            data-type="standard"
                                            data-size="large"
                                            data-theme="outline"
                                            data-text="continue_with"
                                            data-shape="rectangular"
                                            data-logo_alignment="left"
                                        />
                                    </Box>
                                    <Divider sx={{ mb: 2 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            or sign in with email
                                        </Typography>
                                    </Divider>
                                </>
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
                                        href="/forgot-password/"
                                        style={{ textDecoration: "none" }}
                                    >
                                        <Typography variant="body2" color="primary">
                                            Forgot password?
                                        </Typography>
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

                            {/* Registration Link - Conditional visibility (Requirement: 2.5) */}
                            {registrationEnabled && (
                                <Typography
                                    variant="body2"
                                    textAlign="center"
                                    color="text.secondary"
                                    sx={{ mt: 3 }}
                                >
                                    Don&apos;t have an account?{" "}
                                    <Link
                                        href={registerUrl}
                                        style={{ color: "inherit", fontWeight: 600 }}
                                    >
                                        Create one
                                    </Link>
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </Box>

            {/* Custom CSS injection for platform branding */}
            {platform?.customCss && (
                <style dangerouslySetInnerHTML={{ __html: platform.customCss }} />
            )}
        </>
    );
}
