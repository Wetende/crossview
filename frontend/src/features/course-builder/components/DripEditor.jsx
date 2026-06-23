import { useEffect, useMemo, useState } from "react";
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

const getLessons = (nodes = []) => {
    let lessons = [];
    nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
            lessons = lessons.concat(getLessons(node.children));
        } else if (node.type !== "Module") {
            lessons.push(node);
        }
    });
    return lessons;
};

export default function DripEditor({ program, curriculum, onSave }) {
    const [dripEnabled, setDripEnabled] = useState(
        Boolean(program?.dripEnabled),
    );
    const [scheduleMode, setScheduleMode] = useState(
        program?.dripMode === "absolute" ? "date" : "sequence",
    );
    const [saving, setSaving] = useState(false);

    const lessons = useMemo(
        () => (curriculum ? getLessons(curriculum) : []),
        [curriculum],
    );

    const [scheduleByNodeId, setScheduleByNodeId] = useState(() => {
        const map = {};
        lessons.forEach((lesson) => {
            map[lesson.id] = {
                unlockAfterDays: lesson.unlockAfterDays ?? "",
                unlockDate: lesson.unlockDate
                    ? String(lesson.unlockDate).slice(0, 10)
                    : "",
                active: Boolean(
                    (lesson.unlockAfterDays ?? null) ||
                        (lesson.unlockDate ?? null),
                ),
            };
        });
        return map;
    });

    useEffect(() => {
        setScheduleByNodeId(() => {
            const next = {};
            lessons.forEach((lesson) => {
                next[lesson.id] = {
                    unlockAfterDays: lesson.unlockAfterDays ?? "",
                    unlockDate: lesson.unlockDate
                        ? String(lesson.unlockDate).slice(0, 10)
                        : "",
                    active: Boolean(
                        (lesson.unlockAfterDays ?? null) ||
                            (lesson.unlockDate ?? null),
                    ),
                };
            });
            return next;
        });
    }, [lessons]);

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

    const handleSave = () => {
        if (!onSave || saving) return;

        const drip_schedule = dripEnabled
            ? lessons.map((lesson) => {
                  const row = scheduleByNodeId[lesson.id] || {};
                  return {
                      node_id: lesson.id,
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

        setSaving(true);
        onSave(
            {
                drip_enabled: dripEnabled,
                drip_mode: dripMode,
                drip_schedule,
            },
            {
                onFinish: () => setSaving(false),
                onError: () => setSaving(false),
            },
        );
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
                        Control when students can access specific lessons.
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
                                {lessons.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            align="center"
                                            sx={{
                                                py: 4,
                                                color: "text.secondary",
                                            }}
                                        >
                                            No lessons found in curriculum.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {lessons.map((lesson) => (
                                    <TableRow key={lesson.id}>
                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1,
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={500}
                                                >
                                                    {lesson.title}
                                                </Typography>
                                                <Chip
                                                    label={lesson.type}
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
                                                            lesson.id
                                                        ]?.unlockAfterDays ?? ""
                                                    }
                                                    disabled={
                                                        !scheduleByNodeId[
                                                            lesson.id
                                                        ]?.active
                                                    }
                                                    onChange={(e) =>
                                                        handleScheduleChange(
                                                            lesson.id,
                                                            {
                                                                unlockAfterDays:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                    InputProps={{
                                                        endAdornment: (
                                                            <Typography
                                                                variant="caption"
                                                                sx={{ ml: 1 }}
                                                            >
                                                                Days
                                                            </Typography>
                                                        ),
                                                    }}
                                                />
                                            ) : (
                                                <TextField
                                                    type="date"
                                                    size="small"
                                                    value={
                                                        scheduleByNodeId[
                                                            lesson.id
                                                        ]?.unlockDate ?? ""
                                                    }
                                                    disabled={
                                                        !scheduleByNodeId[
                                                            lesson.id
                                                        ]?.active
                                                    }
                                                    onChange={(e) =>
                                                        handleScheduleChange(
                                                            lesson.id,
                                                            {
                                                                unlockDate:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                size="small"
                                                checked={Boolean(
                                                    scheduleByNodeId[lesson.id]
                                                        ?.active,
                                                )}
                                                onChange={(e) =>
                                                    handleScheduleChange(
                                                        lesson.id,
                                                        {
                                                            active: e.target
                                                                .checked,
                                                        },
                                                    )
                                                }
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
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
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
}
