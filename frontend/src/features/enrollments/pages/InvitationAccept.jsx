import { useState } from "react";
import axios from "axios";
import { Head, Link, usePage } from "@inertiajs/react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import PlatformLogo from "@/components/common/PlatformLogo";

export default function InvitationAccept({ invitation, token }) {
    const { auth, platform } = usePage().props;
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    if (!invitation) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "grid",
                    placeItems: "center",
                    px: 2,
                }}
            >
                <Head title="Invitation unavailable" />
                <Card sx={{ width: "100%", maxWidth: 480 }}>
                    <CardContent sx={{ p: 4, textAlign: "center" }}>
                        <Typography variant="h5" fontWeight={700} gutterBottom>
                            Invitation unavailable
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            This invitation has expired, was replaced, or has
                            already been used.
                        </Typography>
                        <Button component={Link} href="/login/">
                            Go to sign in
                        </Button>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    const signedInAsInvitee =
        auth?.user?.email?.toLowerCase() === invitation.email.toLowerCase();
    const accept = async () => {
        setBusy(true);
        setError("");
        try {
            const { data } = await axios.post(
                `/api/learning-operations/invitations/${token}/`,
                {
                    firstName,
                    lastName,
                    password,
                },
            );
            window.location.assign(`/student/programs/${data.programId}/`);
        } catch (requestError) {
            setError(
                requestError?.response?.data?.detail ||
                    "The invitation could not be accepted.",
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "grid",
                placeItems: "center",
                px: 2,
                py: 4,
            }}
        >
            <Head title={`Join ${invitation.program.name}`} />
            <Card sx={{ width: "100%", maxWidth: 520 }}>
                <CardContent sx={{ p: 4 }}>
                    <Stack spacing={2.5}>
                        <Box sx={{ textAlign: "center" }}>
                            <PlatformLogo
                                platform={platform}
                                showName={false}
                                logoHeight={48}
                            />
                            <Typography
                                variant="h4"
                                fontWeight={700}
                                sx={{ mt: 2 }}
                            >
                                Course invitation
                            </Typography>
                            <Typography color="text.secondary">
                                You were invited to join{" "}
                                {invitation.program.name} as {invitation.email}.
                            </Typography>
                        </Box>
                        {error && <Alert severity="error">{error}</Alert>}
                        {invitation.accountExists && !signedInAsInvitee && (
                            <Alert severity="info">
                                This email already has an account. Sign in with{" "}
                                {invitation.email} before accepting.
                            </Alert>
                        )}
                        {!invitation.accountExists && !auth?.user && (
                            <>
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={2}
                                >
                                    <TextField
                                        fullWidth
                                        label="First name"
                                        value={firstName}
                                        onChange={(e) =>
                                            setFirstName(e.target.value)
                                        }
                                    />
                                    <TextField
                                        fullWidth
                                        label="Last name"
                                        value={lastName}
                                        onChange={(e) =>
                                            setLastName(e.target.value)
                                        }
                                    />
                                </Stack>
                                <TextField
                                    fullWidth
                                    type="password"
                                    label="Create password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    helperText="This invitation can create your learner account even when public registration is closed."
                                />
                            </>
                        )}
                        {invitation.accountExists && !signedInAsInvitee ? (
                            <Button
                                component={Link}
                                href={`/login/?${new URLSearchParams({ next: `/course-invitations/${token}/` })}`}
                                variant="contained"
                            >
                                Sign in to accept
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                disabled={
                                    busy ||
                                    (!invitation.accountExists &&
                                        !auth?.user &&
                                        !password)
                                }
                                onClick={accept}
                            >
                                Accept invitation
                            </Button>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}
