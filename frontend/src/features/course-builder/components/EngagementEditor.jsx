import {
    Alert,
    FormControlLabel,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";

const offsetsToText = (offsets) => (Array.isArray(offsets) ? offsets.join(", ") : "");

const parseOffsets = (value) =>
    value
        .split(",")
        .map((item) => Number.parseInt(item.trim(), 10))
        .filter(Number.isInteger);

function ReminderSetting({
    label,
    description,
    enabled,
    offsets,
    onEnabledChange,
    onOffsetsChange,
}) {
    return (
        <Stack spacing={1.5}>
            <FormControlLabel
                control={
                    <Switch
                        checked={enabled}
                        onChange={(event) => onEnabledChange(event.target.checked)}
                    />
                }
                label={label}
            />
            <TextField
                label="Reminder offsets in days"
                value={offsetsToText(offsets)}
                onChange={(event) => onOffsetsChange(parseOffsets(event.target.value))}
                disabled={!enabled}
                helperText={description}
                fullWidth
                size="small"
            />
        </Stack>
    );
}

export default function EngagementEditor({
    policy,
    onPolicyChange,
    gamificationOptIn,
    onGamificationOptInChange,
    platformGamificationEnabled,
    deliveryMode,
}) {
    const updatePolicy = (field, value) =>
        onPolicyChange({ ...policy, [field]: value });
    const automaticGamification = ["self_paced", "live_online"].includes(
        deliveryMode,
    );

    return (
        <Stack spacing={3}>
            <Stack spacing={0.5}>
                <Typography variant="h5" fontWeight="bold">
                    Engagement
                </Typography>
                <Typography color="text.secondary">
                    Configure learner reminders and course-level gamification eligibility.
                </Typography>
            </Stack>

            <ReminderSetting
                label="Assignment reminders"
                description="Positive values are days before the deadline; negative values are days overdue."
                enabled={policy.assignmentRemindersEnabled !== false}
                offsets={policy.assignmentOffsets}
                onEnabledChange={(value) =>
                    updatePolicy("assignmentRemindersEnabled", value)
                }
                onOffsetsChange={(value) => updatePolicy("assignmentOffsets", value)}
            />
            <ReminderSetting
                label="Access-expiry reminders"
                description="Days before course access expires."
                enabled={policy.expiryRemindersEnabled !== false}
                offsets={policy.expiryOffsets}
                onEnabledChange={(value) =>
                    updatePolicy("expiryRemindersEnabled", value)
                }
                onOffsetsChange={(value) => updatePolicy("expiryOffsets", value)}
            />
            <ReminderSetting
                label="Inactivity reminders"
                description="Days after the learner’s most recent meaningful activity."
                enabled={policy.inactivityRemindersEnabled !== false}
                offsets={policy.inactivityOffsets}
                onEnabledChange={(value) =>
                    updatePolicy("inactivityRemindersEnabled", value)
                }
                onOffsetsChange={(value) => updatePolicy("inactivityOffsets", value)}
            />

            <Stack spacing={1}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={Boolean(gamificationOptIn)}
                            onChange={(event) =>
                                onGamificationOptInChange(event.target.checked)
                            }
                            disabled={automaticGamification}
                        />
                    }
                    label="Enable XP, badges and streaks for this course"
                />
                {!platformGamificationEnabled && (
                    <Alert severity="info">
                        The platform gamification feature must also be enabled before
                        awards are issued.
                    </Alert>
                )}
                {automaticGamification && (
                    <Typography variant="caption" color="text.secondary">
                        Gamification is automatically eligible for this delivery mode.
                    </Typography>
                )}
            </Stack>
        </Stack>
    );
}
