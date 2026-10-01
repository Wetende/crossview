import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState,
} from "react";
import {
    Box,
    Typography,
    Switch,
    FormControlLabel,
    Paper,
    TextField,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Stack,
    Button,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";
import { AccessTime as TimeIcon } from "@mui/icons-material";
import AutosaveStatus from "./AutosaveStatus";
import useAutosave from "../hooks/useAutosave";

const getDripItems = (nodes = [], depth = 0) => {
    let items = [];
    nodes.forEach((node) => {
        items.push({ ...node, depth });
        if (node.children && node.children.length > 0) {
            items = items.concat(getDripItems(node.children, depth + 1));
        }
    });
    return items;
};

const isFilled = (value) => value !== undefined && value !== null && value !== "";

// Inputs hold strings, the server sends numbers/null: compare as strings.
const normalize = (value) => (isFilled(value) ? String(value) : "");

const VALUE_FIELDS = ["unlockAfterDays", "unlockDate"];

const modeField = (scheduleMode) =>
    scheduleMode === "date" ? "unlockDate" : "unlockAfterDays";

// A row counts as scheduled on the server when the field for the current
// schedule mode is set; the other mode's saved value is kept but not shown.
const toServerScheduleRow = (item, scheduleMode) => {
    const row = {
        unlockAfterDays: normalize(item.unlockAfterDays),
        unlockDate: item.unlockDate ? String(item.unlockDate).slice(0, 10) : "",
    };
    return { ...row, active: isFilled(row[modeField(scheduleMode)]) };
};

const buildInitialSchedule = (dripItems, scheduleMode) => {
    const rows = {};
    dripItems.forEach((item) => {
        rows[item.id] = toServerScheduleRow(item, scheduleMode);
    });
    return { rows, baseline: rows };
};

/*
 * Reconcile a refreshed curriculum prop with local rows.
 *
 * `baseline` is what we believe the server holds for each row: the last
 * curriculum prop, advanced to the values we sent when a save goes out. A
 * field takes the server's value only when the server changed it relative to
 * the baseline (another instructor, or a save we did not make) AND the local
 * field still equals the baseline (no unsaved edit). Otherwise local wins.
 * So the echo of our own save never undoes an edit made after sending it,
 * while an untouched row still follows another instructor's clear.
 */
const reconcileSchedule = (prev, dripItems, scheduleMode) => {
    const rows = {};
    const baseline = {};
    const field = modeField(scheduleMode);
    dripItems.forEach((item) => {
        const server = toServerScheduleRow(item, scheduleMode);
        const local = prev.rows[item.id];
        const base = prev.baseline[item.id];
        if (!local || !base) {
            rows[item.id] = server;
            baseline[item.id] = server;
            return;
        }

        const next = { ...local };
        VALUE_FIELDS.forEach((name) => {
            const serverChanged =
                normalize(server[name]) !== normalize(base[name]);
            if (serverChanged && normalize(local[name]) === normalize(base[name])) {
                next[name] = server[name];
            }
        });

        // The server stores no "on" flag: a row is on when its value is set.
        // Follow a server-side change of the value only if the instructor has
        // not flipped the switch since the baseline.
        const serverValueChanged =
            normalize(server[field]) !== normalize(base[field]);
        const followServer = serverValueChanged && local.active === base.active;
        if (followServer) {
            next.active = server.active;
        }

        rows[item.id] = next;
        baseline[item.id] = {
            unlockAfterDays: server.unlockAfterDays,
            unlockDate: server.unlockDate,
            active: followServer ? server.active : base.active,
        };
    });
    return { rows, baseline };
};

// A save is going out: from now on its values are what the server holds.
const markScheduleSent = (prev, sentRows) => {
    const baseline = { ...prev.baseline };
    sentRows.forEach((sent) => {
        const name = "unlock_date" in sent ? "unlockDate" : "unlockAfterDays";
        const value = "unlock_date" in sent ? sent.unlock_date : sent.unlock_after_days;
        baseline[sent.node_id] = {
            ...(baseline[sent.node_id] || { unlockAfterDays: "", unlockDate: "" }),
            [name]: normalize(value),
            active: Boolean(prev.rows[sent.node_id]?.active),
        };
    });
    return { ...prev, baseline };
};

// Switching mode shows the other field: a row is on when that field is set.
const switchScheduleMode = (prev, scheduleMode) => {
    const field = modeField(scheduleMode);
    const remap = (map) =>
        Object.fromEntries(
            Object.entries(map).map(([id, row]) => [
                id,
                { ...row, active: isFilled(row[field]) },
            ]),
        );
    return { rows: remap(prev.rows), baseline: remap(prev.baseline) };
};

const DripEditor = forwardRef(function DripEditor(
    { program, curriculum, onSave },
    ref,
) {
    const [dripEnabled, setDripEnabled] = useState(
        Boolean(program?.dripEnabled),
    );
    const [scheduleMode, setScheduleMode] = useState(
        program?.dripMode === "absolute" ? "date" : "sequence",
    );
    const [saving, setSaving] = useState(false);

    const dripItems = useMemo(
        () => (curriculum ? getDripItems(curriculum) : []),
        [curriculum],
    );

    const [schedule, setSchedule] = useState(() =>
        buildInitialSchedule(dripItems, scheduleMode),
    );
    const scheduleByNodeId = schedule.rows;

    useEffect(() => {
        setSchedule((prev) => reconcileSchedule(prev, dripItems, scheduleMode));
    }, [dripItems, scheduleMode]);

    const handleScheduleModeChange = (nextMode) => {
        setScheduleMode(nextMode);
        setSchedule((prev) => switchScheduleMode(prev, nextMode));
    };

    const dripMode = useMemo(() => {
        if (!dripEnabled) return "none";
        return scheduleMode === "date" ? "absolute" : "relative";
    }, [dripEnabled, scheduleMode]);

    const handleScheduleChange = (nodeId, patch) => {
        setSchedule((prev) => ({
            ...prev,
            rows: {
                ...prev.rows,
                [nodeId]: {
                    ...(prev.rows[nodeId] || {
                        unlockAfterDays: "",
                        unlockDate: "",
                        active: false,
                    }),
                    ...patch,
                },
            },
        }));
    };

    const buildSavePayload = useCallback(() => {
        // Send only the current mode's field per row: the server leaves the
        // other field untouched, so switching modes never wipes saved values.
        const drip_schedule = dripEnabled
            ? dripItems.map((item) => {
                  const row = scheduleByNodeId[item.id] || {};
                  if (scheduleMode === "date") {
                      return {
                          node_id: item.id,
                          unlock_date:
                              row.active && isFilled(row.unlockDate)
                                  ? row.unlockDate
                                  : null,
                      };
                  }
                  return {
                      node_id: item.id,
                      unlock_after_days:
                          row.active && isFilled(row.unlockAfterDays)
                              ? Number(row.unlockAfterDays)
                              : null,
                  };
              })
            : [];

        return {
            drip_enabled: dripEnabled,
            drip_mode: dripMode,
            drip_schedule,
        };
    }, [dripEnabled, dripItems, dripMode, scheduleByNodeId, scheduleMode]);

    const savePayload = useCallback(
        (payload, callbacks = {}) => {
            if (!onSave) return;
            if (payload.drip_schedule?.length) {
                setSchedule((prev) =>
                    markScheduleSent(prev, payload.drip_schedule),
                );
            }
            onSave(payload, callbacks);
        },
        [onSave],
    );

    const autosaveValue = useMemo(
        () => ({
            dripEnabled,
            scheduleByNodeId,
            scheduleMode,
        }),
        [dripEnabled, scheduleByNodeId, scheduleMode],
    );

    const autosave = useAutosave({
        enabled: Boolean(onSave && program?.id),
        value: autosaveValue,
        buildPayload: buildSavePayload,
        save: savePayload,
        debounceMs: 2000,
        saveKey: `drip:${program?.id || "new"}`,
    });

    useImperativeHandle(
        ref,
        () => ({
            flushAutosave: autosave.flush,
        }),
        [autosave.flush],
    );

    const handleSave = () => {
        if (!onSave || saving) return;

        setSaving(true);
        void autosave.flush({
            force: true,
            onFinish: () => setSaving(false),
            onError: () => setSaving(false),
        });
    };

    return (
        <Stack spacing={4} sx={{ maxWidth: 800, mx: "auto", py: 2 }}>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                }}
            >
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        Drip Content Schedule
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Control when students can access modules and lessons.
                    </Typography>
                </Box>
                <FormControlLabel
                    control={
                        <Switch
                            checked={dripEnabled}
                            onChange={(e) => setDripEnabled(e.target.checked)}
                        />
                    }
                    label="Enable Drip"
                />
            </Box>

            {dripEnabled && (
                <>
                    <Paper variant="outlined" sx={{ p: 3, bgcolor: "#f8f9fa" }}>
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: "bold", mb: 2 }}
                        >
                            Global Settings
                        </Typography>
                        <FormControl
                            fullWidth
                            size="small"
                            sx={{ mb: 2, maxWidth: 300 }}
                        >
                            <InputLabel>Schedule Mode</InputLabel>
                            <Select
                                value={scheduleMode}
                                onChange={(e) =>
                                    handleScheduleModeChange(e.target.value)
                                }
                                label="Schedule Mode"
                            >
                                <MenuItem value="sequence">
                                    Days after enrollment
                                </MenuItem>
                                <MenuItem value="date">Specific Date</MenuItem>
                            </Select>
                        </FormControl>
                        <Typography variant="caption" color="textSecondary">
                            {scheduleMode === "sequence"
                                ? "Content unlocks X days after the student enrolls."
                                : "Content unlocks on a specific calendar date for all students."}
                        </Typography>
                    </Paper>

                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead sx={{ bgcolor: "grey.50" }}>
                                <TableRow>
                                    <TableCell>Content</TableCell>
                                    <TableCell width={200}>
                                        {scheduleMode === "sequence"
                                            ? "Unlock After (Days)"
                                            : "Unlock Date"}
                                    </TableCell>
                                    <TableCell width={100}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {dripItems.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            align="center"
                                            sx={{
                                                py: 4,
                                                color: "text.secondary",
                                            }}
                                        >
                                            No course materials found in curriculum.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {dripItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1,
                                                    pl: item.depth * 2,
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{ fontWeight: 500 }}
                                                >
                                                    {item.title}
                                                </Typography>
                                                <Chip
                                                    label={item.type}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: "0.65rem",
                                                    }}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {scheduleMode === "sequence" ? (
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                    placeholder="0"
                                                    value={
                                                        scheduleByNodeId[
                                                            item.id
                                                        ]?.unlockAfterDays ?? ""
                                                    }
                                                    disabled={
                                                        !scheduleByNodeId[
                                                            item.id
                                                        ]?.active
                                                    }
                                                    onChange={(e) =>
                                                        handleScheduleChange(
                                                            item.id,
                                                            {
                                                                unlockAfterDays:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                    slotProps={{
                                                        htmlInput: {
                                                            min: 1,
                                                            "aria-label": `Unlock ${item.title} after days`,
                                                        },
                                                        input: {
                                                            endAdornment: (
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{ ml: 1 }}
                                                                >
                                                                    Days
                                                                </Typography>
                                                            ),
                                                        },
                                                    }}
                                                />
                                            ) : (
                                                <TextField
                                                    type="date"
                                                    size="small"
                                                    value={
                                                        scheduleByNodeId[
                                                            item.id
                                                        ]?.unlockDate ?? ""
                                                    }
                                                    disabled={
                                                        !scheduleByNodeId[
                                                            item.id
                                                        ]?.active
                                                    }
                                                    onChange={(e) =>
                                                        handleScheduleChange(
                                                            item.id,
                                                            {
                                                                unlockDate:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                    slotProps={{
                                                        htmlInput: {
                                                            "aria-label": `Unlock ${item.title} on date`,
                                                        },
                                                    }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                size="small"
                                                checked={Boolean(
                                                    scheduleByNodeId[item.id]
                                                        ?.active,
                                                )}
                                                onChange={(e) =>
                                                    handleScheduleChange(
                                                        item.id,
                                                        {
                                                            active: e.target
                                                                .checked,
                                                        },
                                                    )
                                                }
                                                slotProps={{
                                                    input: {
                                                        "aria-label": `Enable schedule for ${item.title}`,
                                                    },
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                </>
            )}
            {!dripEnabled && (
                <Box
                    sx={{
                        textAlign: "center",
                        py: 8,
                        bgcolor: "grey.50",
                        borderRadius: 2,
                        border: "1px dashed #ddd",
                    }}
                >
                    <TimeIcon
                        sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                    />
                    <Typography color="textSecondary">
                        Drip content is currently disabled.
                    </Typography>
                    <Typography variant="caption" color="textDisabled">
                        Enable it to schedule content availability.
                    </Typography>
                </Box>
            )}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                }}
            >
                <AutosaveStatus
                    status={autosave.status}
                    lastSavedAt={autosave.lastSavedAt}
                    disabledReason="Autosave starts after the course exists."
                />
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving
                        ? "Saving..."
                        : dripEnabled
                          ? "Save Schedule"
                          : "Save Changes"}
                </Button>
            </Box>
        </Stack>
    );
});

export default DripEditor;
