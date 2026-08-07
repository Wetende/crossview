import { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

const EnrollmentIntentDialog = ({
    open,
    onClose,
    program,
    user = null,
    success = null,
}) => {
    const { data, setData, post, processing, errors, clearErrors } = useForm({
        name: user?.fullName || "",
        email: user?.email || "",
        phone: user?.phone || "",
    });

    useEffect(() => {
        if (!open) return;
        setData({
            name: user?.fullName || "",
            email: user?.email || "",
            phone: user?.phone || "",
        });
        clearErrors();
    }, [clearErrors, open, setData, user?.email, user?.fullName, user?.phone]);

    const handleSubmit = (event) => {
        event.preventDefault();
        post(`/programs/${program.id}/enrollment-intent/`, {
            preserveScroll: true,
        });
    };

    if (success) {
        return (
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
                <DialogTitle>{success.title}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ pt: 1 }}>
                        <Alert severity="success">{success.message}</Alert>
                        <Typography color="text.secondary">
                            Your sign-in details were sent to <strong>{success.email}</strong>.
                            Use those details to continue securely.
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={onClose}>Close</Button>
                    {success.emailInboxUrl && (
                        <Button
                            component="a"
                            href={success.emailInboxUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outlined"
                        >
                            Open email
                        </Button>
                    )}
                    <Button component="a" href={success.loginUrl} variant="contained">
                        Sign in and continue
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={processing ? undefined : onClose} fullWidth maxWidth="sm">
            <Stack component="form" onSubmit={handleSubmit}>
                <DialogTitle>Continue enrollment</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ pt: 1 }}>
                        <Typography color="text.secondary">
                            Enter your details for {program.name}. We will save your place and
                            continue with account verification, free access, or secure checkout.
                        </Typography>
                        {errors._form && <Alert severity="error">{errors._form}</Alert>}
                        <TextField
                            label="Full name"
                            value={data.name}
                            onChange={(event) => setData("name", event.target.value)}
                            error={Boolean(errors.name)}
                            helperText={errors.name}
                            required
                            autoFocus
                        />
                        <TextField
                            label="Email address"
                            type="email"
                            value={data.email}
                            onChange={(event) => setData("email", event.target.value)}
                            error={Boolean(errors.email)}
                            helperText={errors.email}
                            required
                            disabled={Boolean(user)}
                        />
                        <TextField
                            label="Phone number"
                            value={data.phone}
                            onChange={(event) => setData("phone", event.target.value)}
                            error={Boolean(errors.phone)}
                            helperText={errors.phone}
                            required
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={onClose} disabled={processing}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={processing}>
                        {processing ? "Saving…" : "Continue"}
                    </Button>
                </DialogActions>
            </Stack>
        </Dialog>
    );
};

export default EnrollmentIntentDialog;
