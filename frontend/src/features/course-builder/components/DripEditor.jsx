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

    const [scheduleByNodeId, setScheduleByNodeId] = useState(() => {
        const map = {};
        dripItems.forEach((item) => {
            map[item.id] = {
                unlockAfterDays: item.unlockAfterDays ?? "",
                unlockDate: item.unlockDate
                    ? String(item.unlockDate).slice(0, 10)
                    : "",
                active: Boolean(
                    (item.unlockAfterDays ?? null) || (item.unlockDate ?? null),
                ),
            };
        });
        return map;
    });

    useEffect(() => {
        setScheduleByNodeId(() => {
            const next = {};
            dripItems.forEach((item) => {
                next[item.id] = {
                    unlockAfterDays: item.unlockAfterDays ?? "",
                    unlockDate: item.unlockDate
                        ? String(item.unlockDate).slice(0, 10)
                        : "",
                    active: Boolean(
                        (item.unlockAfterDays ?? null) ||
                            (item.unlockDate ?? null),
                    ),
                };
            });
            return next;
        });
    }, [dripItems]);

    const dripMode = useMemo(() => {
        if (!dripEnabled) return "none";
        return scheduleMode === "date" ? "absolute" : "relative";
    }, [dripEnabled, scheduleMode]);

    const handleScheduleChange = (nodeId, patch) => {
        setScheduleByNodeId((prev) => ({
            ...prev,
            [nodeId]: {
                ...(prev[nodeId] || {
                    unlockAfterDays: "",
                    unlockDate: "",
                    active: false,
                }),
                ...patch,
            },
        }));
    };

    const buildSavePayload = useCallback(() => {
        const drip_schedule = dripEnabled
            ? dripItems.map((item) => {
                  const row = scheduleByNodeId[item.id] || {};
                  return {
                      node_id: item.id,
                      unlock_after_days:
                          scheduleMode === "sequence" &&
                          row.active &&
                          row.unlockAfterDays !== ""
                              ? Number(row.unlockAfterDays)
                              : null,
                      unlock_date:
                          scheduleMode === "date" && row.active && row.unlockDate
                              ? row.unlockDate
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
                    <Typography variant="h6" fontWeight="bold">
                        Drip Content Schedule
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
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
                            fontWeight="bold"
                            sx={{ mb: 2 }}
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
                                    setScheduleMode(e.target.value)
                                }
                                label="Schedule Mode"
                            >
                                <MenuItem value="sequence">
                                    Days after enrollment
                                </MenuItem>
                                <MenuItem value="date">Specific Date</MenuItem>
                            </Select>
                        </FormControl>
                        <Typography variant="caption" color="text.secondary">
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
                                                    fontWeight={500}
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
                    <Typography color="text.secondary">
                        Drip content is currently disabled.
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
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
