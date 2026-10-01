import {
    Alert,
    Button,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

export default function GoogleAttendanceReview({
    connection,
    session,
    unmatched,
    roster,
    mapping,
    busy,
    onConnect,
    onSync,
    onMappingChange,
    onMap,
}) {
    const authorized =
        connection?.grantedCapabilities?.includes("meet_attendance");
    return (
        <Stack spacing={2}>
            {!authorized && (
                <Alert
                    severity="info"
                    action={
                        <Button onClick={onConnect} disabled={busy}>
                            Enable attendance
                        </Button>
                    }
                >
                    Enable Google Meet attendance permission to synchronize
                    verified join and leave evidence.
                </Alert>
            )}
            {authorized && session.hasEnded && (
                <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
                    <Button
                        variant="outlined"
                        onClick={onSync}
                        disabled={busy || !session.providerEventId}
                    >
                        Synchronize Google Meet
                    </Button>
                </Stack>
            )}
            {unmatched.length > 0 && (
                <Stack spacing={1.5}>
                    <Typography variant="subtitle1" fontWeight={700}>
                        Unmatched Google participants
                    </Typography>
                    {unmatched.map((participant, index) => {
                        const key =
                            participant.externalUserId ||
                            participant.participantName ||
                            `anonymous-${index}`;
                        return (
                            <Stack
                                key={key}
                                direction={{ xs: "column", md: "row" }}
                                spacing={1}
                                sx={{ alignItems: { md: "center" } }}
                            >
                                <Typography sx={{ minWidth: 220 }}>
                                    {participant.displayName ||
                                        "Anonymous participant"}
                                </Typography>
                                {participant.anonymous ||
                                !participant.externalUserId ? (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Anonymous participants require an
                                        audited attendance decision; they cannot
                                        be mapped.
                                    </Typography>
                                ) : (
                                    <>
                                        <TextField
                                            select
                                            size="small"
                                            label="Map to learner"
                                            value={mapping[key] || ""}
                                            onChange={(event) =>
                                                onMappingChange(
                                                    key,
                                                    event.target.value,
                                                )
                                            }
                                            sx={{ minWidth: 240 }}
                                        >
                                            {roster.map((row) => (
                                                <MenuItem
                                                    key={row.enrollmentId}
                                                    value={row.enrollmentId}
                                                >
                                                    {row.learner.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                        <Button
                                            onClick={() =>
                                                onMap(participant, mapping[key])
                                            }
                                            disabled={busy || !mapping[key]}
                                        >
                                            Save mapping
                                        </Button>
                                    </>
                                )}
                            </Stack>
                        );
                    })}
                </Stack>
            )}
        </Stack>
    );
}
