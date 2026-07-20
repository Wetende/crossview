import {
    Autocomplete,
    Box,
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
} from "@mui/material";

const SESSION_KIND_OPTIONS = [
    { value: "live_meeting", label: "Live meeting" },
    { value: "live_stream", label: "Live stream" },
    { value: "in_person_session", label: "In-person session" },
];

const PROVIDERS = {
    live_meeting: [
        { value: "google_meet", label: "Google Meet" },
        { value: "zoom", label: "Zoom" },
        { value: "teams", label: "Microsoft Teams" },
        { value: "custom", label: "Other secure link" },
    ],
    live_stream: [
        { value: "youtube", label: "YouTube Live" },
        { value: "vimeo", label: "Vimeo" },
        { value: "custom", label: "Other secure stream" },
    ],
    in_person_session: [{ value: "physical", label: "In person" }],
};

const TIMEZONES = (() => {
    if (typeof Intl.supportedValuesOf === "function") {
        return Intl.supportedValuesOf("timeZone");
    }
    return ["UTC", "Africa/Nairobi", "Australia/Melbourne"];
})();

function LabeledField({ label, error, required = false, children }) {
    return (
        <Box>
            <InputLabel
                shrink
                required={required}
                error={Boolean(error)}
                sx={{ mb: 1, fontWeight: 500 }}
            >
                {label}
            </InputLabel>
            {children}
            {error && <FormHelperText error>{error}</FormHelperText>}
        </Box>
    );
}

export default function ScheduledSessionFields({
    values,
    errors,
    onBlur,
    onChange,
}) {
    const providers = PROVIDERS[values.sessionKind] || PROVIDERS.live_meeting;
    const isInPerson = values.sessionKind === "in_person_session";

    const changeKind = (sessionKind) => {
        const nextProvider = PROVIDERS[sessionKind][0].value;
        onChange({ sessionKind, sessionProvider: nextProvider });
    };

    return (
        <Stack spacing={2}>
            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                }}
            >
                <FormControl fullWidth size="small">
                    <InputLabel>Activity</InputLabel>
                    <Select
                        label="Activity"
                        value={values.sessionKind}
                        onChange={(event) => changeKind(event.target.value)}
                    >
                        {SESSION_KIND_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                    <InputLabel>Provider</InputLabel>
                    <Select
                        label="Provider"
                        value={values.sessionProvider}
                        onChange={(event) =>
                            onChange({ sessionProvider: event.target.value })
                        }
                        disabled={isInPerson}
                    >
                        {providers.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {!isInPerson && (
                <>
                    <LabeledField
                        label={
                            values.sessionKind === "live_stream"
                                ? "Stream URL"
                                : "Meeting URL"
                        }
                        required
                        error={errors.videoUrl}
                    >
                        <TextField
                            fullWidth
                            size="small"
                            value={values.videoUrl}
                            onChange={(event) =>
                                onChange({ videoUrl: event.target.value })
                            }
                            onBlur={() => onBlur("videoUrl")}
                            error={Boolean(errors.videoUrl)}
                            placeholder="https://…"
                            inputProps={{ inputMode: "url" }}
                        />
                    </LabeledField>

                    {values.sessionKind === "live_meeting" &&
                        values.sessionProvider !== "google_meet" && (
                            <LabeledField
                                label="Meeting passcode"
                                error={errors.meetingPassword}
                            >
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={values.meetingPassword}
                                    onChange={(event) =>
                                        onChange({
                                            meetingPassword: event.target.value,
                                        })
                                    }
                                    onBlur={() => onBlur("meetingPassword")}
                                    error={Boolean(errors.meetingPassword)}
                                    helperText="Optional. Stored encrypted and revealed only during the join window."
                                />
                            </LabeledField>
                        )}

                    <LabeledField
                        label="Recording or replay URL"
                        error={errors.recordingUrl}
                    >
                        <TextField
                            fullWidth
                            size="small"
                            value={values.recordingUrl}
                            onChange={(event) =>
                                onChange({ recordingUrl: event.target.value })
                            }
                            onBlur={() => onBlur("recordingUrl")}
                            error={Boolean(errors.recordingUrl)}
                            placeholder="Optional secure recording URL"
                            inputProps={{ inputMode: "url" }}
                        />
                    </LabeledField>
                </>
            )}

            {isInPerson && (
                <Box
                    sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    }}
                >
                    <LabeledField label="Venue" required error={errors.venue}>
                        <TextField
                            fullWidth
                            size="small"
                            value={values.venue}
                            onChange={(event) =>
                                onChange({ venue: event.target.value })
                            }
                            onBlur={() => onBlur("venue")}
                            error={Boolean(errors.venue)}
                        />
                    </LabeledField>
                    <LabeledField label="Room">
                        <TextField
                            fullWidth
                            size="small"
                            value={values.room}
                            onChange={(event) =>
                                onChange({ room: event.target.value })
                            }
                        />
                    </LabeledField>
                    <Box sx={{ gridColumn: { md: "1 / -1" } }}>
                        <LabeledField
                            label="Address"
                            required
                            error={errors.address}
                        >
                            <TextField
                                fullWidth
                                size="small"
                                value={values.address}
                                onChange={(event) =>
                                    onChange({ address: event.target.value })
                                }
                                onBlur={() => onBlur("address")}
                                error={Boolean(errors.address)}
                            />
                        </LabeledField>
                    </Box>
                    <LabeledField label="Directions">
                        <TextField
                            fullWidth
                            size="small"
                            multiline
                            minRows={2}
                            value={values.directions}
                            onChange={(event) =>
                                onChange({ directions: event.target.value })
                            }
                        />
                    </LabeledField>
                    <LabeledField label="Attendance instructions">
                        <TextField
                            fullWidth
                            size="small"
                            multiline
                            minRows={2}
                            value={values.attendanceInstructions}
                            onChange={(event) =>
                                onChange({
                                    attendanceInstructions: event.target.value,
                                })
                            }
                        />
                    </LabeledField>
                </Box>
            )}

            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                }}
            >
                <LabeledField
                    label="Start date"
                    required
                    error={errors.startDate}
                >
                    <TextField
                        type="date"
                        fullWidth
                        size="small"
                        value={values.startDate}
                        onChange={(event) =>
                            onChange({ startDate: event.target.value })
                        }
                        onBlur={() => onBlur("startDate")}
                        error={Boolean(errors.startDate)}
                    />
                </LabeledField>
                <LabeledField
                    label="Start time"
                    required
                    error={errors.startTime}
                >
                    <TextField
                        type="time"
                        fullWidth
                        size="small"
                        value={values.startTime}
                        onChange={(event) =>
                            onChange({ startTime: event.target.value })
                        }
                        onBlur={() => onBlur("startTime")}
                        error={Boolean(errors.startTime)}
                    />
                </LabeledField>
                <LabeledField label="End date" required error={errors.endDate}>
                    <TextField
                        type="date"
                        fullWidth
                        size="small"
                        value={values.endDate}
                        onChange={(event) =>
                            onChange({ endDate: event.target.value })
                        }
                        onBlur={() => onBlur("endDate")}
                        error={Boolean(errors.endDate)}
                    />
                </LabeledField>
                <LabeledField label="End time" required error={errors.endTime}>
                    <TextField
                        type="time"
                        fullWidth
                        size="small"
                        value={values.endTime}
                        onChange={(event) =>
                            onChange({ endTime: event.target.value })
                        }
                        onBlur={() => onBlur("endTime")}
                        error={Boolean(errors.endTime)}
                    />
                </LabeledField>
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                }}
            >
                <LabeledField
                    label="Lesson duration"
                    required
                    error={errors.duration}
                >
                    <TextField
                        fullWidth
                        size="small"
                        value={values.duration}
                        onChange={(event) =>
                            onChange({ duration: event.target.value })
                        }
                        onBlur={() => onBlur("duration")}
                        error={Boolean(errors.duration)}
                        placeholder="Example: 2h 45m"
                    />
                </LabeledField>
                <LabeledField label="Timezone" required error={errors.timezone}>
                    <Autocomplete
                        options={TIMEZONES}
                        value={values.timezone || null}
                        onChange={(_event, value) =>
                            onChange({ timezone: value || "" })
                        }
                        onBlur={() => onBlur("timezone")}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                size="small"
                                error={Boolean(errors.timezone)}
                                placeholder="Search timezones"
                            />
                        )}
                    />
                </LabeledField>
            </Box>
        </Stack>
    );
}
