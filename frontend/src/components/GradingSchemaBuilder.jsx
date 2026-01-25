/**
 * GradingSchemaBuilder Component
 * Visual builder for configuring grading schemas in blueprints
 */

import { useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    IconButton,
    Stack,
    Chip,
    Alert,
    Divider,
    Grid,
    Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import InfoIcon from "@mui/icons-material/Info";

const GRADING_TYPES = [
    {
        value: "weighted",
        label: "Weighted Average",
        description:
            "Multiple components with percentage weights (e.g., CAT 30%, Exam 70%)",
    },
    {
        value: "competency",
        label: "Competency-Based",
        description: "Competent / Not Yet Competent assessment",
    },
    {
        value: "rubric",
        label: "Rubric (CBC Style)",
        description: "4-point scale with criteria",
    },
    {
        value: "percentage",
        label: "Simple Percentage",
        description: "Single 0-100 score",
    },
    {
        value: "checklist",
        label: "Checklist",
        description: "Pass/Fail per item",
    },
    {
        value: "pass_fail",
        label: "Pass/Fail",
        description: "Simple pass or fail",
    },
];

/**
 * Weighted Components Builder
 */
function WeightedBuilder({ components = [], passMark, onChange }) {
    const [newComponent, setNewComponent] = useState({
        key: "",
        label: "",
        weight: 0,
    });

    const totalWeight = components.reduce(
        (sum, c) => sum + (parseFloat(c.weight) || 0),
        0,
    );
    const isValid = Math.abs(totalWeight - 1) < 0.001;

    const addComponent = () => {
        if (newComponent.label.trim() && newComponent.weight > 0) {
            const key = newComponent.label.toLowerCase().replace(/\s+/g, "_");
            onChange({
                components: [
                    ...components,
                    {
                        ...newComponent,
                        key,
                        weight: parseFloat(newComponent.weight) / 100,
                    },
                ],
            });
            setNewComponent({ key: "", label: "", weight: 0 });
        }
    };

    const removeComponent = (index) => {
        onChange({
            components: components.filter((_, i) => i !== index),
        });
    };

    const updatePassMark = (value) => {
        onChange({ pass_mark: parseInt(value) || 0 });
    };

    return (
        <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
                Add grade components with percentage weights (must total 100%)
            </Typography>

            {/* Existing Components */}
            {components.length > 0 && (
                <Box sx={{ bgcolor: "grey.50", borderRadius: 1, p: 2 }}>
                    {components.map((comp, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                py: 1,
                                borderBottom:
                                    index < components.length - 1
                                        ? "1px solid"
                                        : "none",
                                borderColor: "divider",
                            }}
                        >
                            <DragIndicatorIcon color="action" />
                            <Typography sx={{ flex: 1 }}>
                                {comp.label}
                            </Typography>
                            <Chip
                                label={`${(comp.weight * 100).toFixed(0)}%`}
                                size="small"
                                color="primary"
                            />
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeComponent(index)}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    ))}
                    <Box
                        sx={{
                            mt: 2,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Typography variant="body2">
                            Total:{" "}
                            <strong>{(totalWeight * 100).toFixed(0)}%</strong>
                        </Typography>
                        {!isValid && totalWeight > 0 && (
                            <Chip
                                label={
                                    totalWeight < 1
                                        ? `Need ${((1 - totalWeight) * 100).toFixed(0)}% more`
                                        : "Over 100%"
                                }
                                size="small"
                                color="error"
                            />
                        )}
                        {isValid && (
                            <Chip
                                label="✓ Valid"
                                size="small"
                                color="success"
                            />
                        )}
                    </Box>
                </Box>
            )}

            {/* Add New Component */}
            <Grid container spacing={2} alignItems="flex-end">
                <Grid size={{ xs: 5 }}>
                    <TextField
                        label="Component Name"
                        placeholder="e.g., CAT 1, Final Exam"
                        value={newComponent.label}
                        onChange={(e) =>
                            setNewComponent({
                                ...newComponent,
                                label: e.target.value,
                            })
                        }
                        size="small"
                        fullWidth
                    />
                </Grid>
                <Grid size={{ xs: 3 }}>
                    <TextField
                        label="Weight (%)"
                        type="number"
                        value={newComponent.weight || ""}
                        onChange={(e) =>
                            setNewComponent({
                                ...newComponent,
                                weight: e.target.value,
                            })
                        }
                        inputProps={{ min: 1, max: 100 }}
                        size="small"
                        fullWidth
                    />
                </Grid>
                <Grid size={{ xs: 4 }}>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={addComponent}
                        disabled={
                            !newComponent.label.trim() || !newComponent.weight
                        }
                        fullWidth
                    >
                        Add
                    </Button>
                </Grid>
            </Grid>

            <Divider />

            <TextField
                label="Pass Mark (%)"
                type="number"
                value={passMark || 50}
                onChange={(e) => updatePassMark(e.target.value)}
                inputProps={{ min: 0, max: 100 }}
                size="small"
                sx={{ maxWidth: 150 }}
            />
        </Stack>
    );
}

/**
 * Competency Levels Builder
 */
function CompetencyBuilder({ levels = [], components = [], onChange }) {
    const [newLevel, setNewLevel] = useState({ label: "", passing: false });
    const [newComponent, setNewComponent] = useState("");

    const defaultLevels =
        levels.length > 0
            ? levels
            : [
                  { key: "nyc", label: "Not Yet Competent", passing: false },
                  { key: "c", label: "Competent", passing: true },
              ];

    const addLevel = () => {
        if (newLevel.label.trim()) {
            const key = newLevel.label.toLowerCase().replace(/\s+/g, "_");
            onChange({
                levels: [
                    ...(levels.length > 0 ? levels : defaultLevels),
                    { ...newLevel, key },
                ],
            });
            setNewLevel({ label: "", passing: false });
        }
    };

    const addComponent = () => {
        if (newComponent.trim()) {
            onChange({ components: [...components, newComponent.trim()] });
            setNewComponent("");
        }
    };

    return (
        <Stack spacing={3}>
            {/* Competency Levels */}
            <Box>
                <Typography variant="subtitle2" gutterBottom>
                    Competency Levels
                </Typography>
                <Stack spacing={1} sx={{ mb: 2 }}>
                    {(levels.length > 0 ? levels : defaultLevels).map(
                        (level, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    p: 1,
                                    bgcolor: "grey.50",
                                    borderRadius: 1,
                                }}
                            >
                                <Typography sx={{ flex: 1 }}>
                                    {level.label}
                                </Typography>
                                <Chip
                                    label={
                                        level.passing
                                            ? "Passing"
                                            : "Not Passing"
                                    }
                                    size="small"
                                    color={level.passing ? "success" : "error"}
                                />
                            </Box>
                        ),
                    )}
                </Stack>
            </Box>

            {/* Assessment Areas */}
            <Box>
                <Typography variant="subtitle2" gutterBottom>
                    Assessment Areas (optional)
                </Typography>
                <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    sx={{ mb: 2 }}
                >
                    {components.map((comp, index) => (
                        <Chip
                            key={index}
                            label={comp}
                            onDelete={() =>
                                onChange({
                                    components: components.filter(
                                        (_, i) => i !== index,
                                    ),
                                })
                            }
                        />
                    ))}
                </Stack>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                        placeholder="Add assessment area"
                        value={newComponent}
                        onChange={(e) => setNewComponent(e.target.value)}
                        size="small"
                        onKeyPress={(e) =>
                            e.key === "Enter" &&
                            (e.preventDefault(), addComponent())
                        }
                    />
                    <Button
                        variant="outlined"
                        onClick={addComponent}
                        disabled={!newComponent.trim()}
                    >
                        Add
                    </Button>
                </Box>
            </Box>
        </Stack>
    );
}

/**
 * Rubric Builder
 */
function RubricBuilder({ levels = [], criteria = [], onChange }) {
    const [newCriterion, setNewCriterion] = useState("");

    const defaultLevels =
        levels.length > 0
            ? levels
            : [
                  { score: 1, label: "Below Expectations" },
                  { score: 2, label: "Approaching" },
                  { score: 3, label: "Meeting" },
                  { score: 4, label: "Exceeding" },
              ];

    const addCriterion = () => {
        if (newCriterion.trim()) {
            onChange({ criteria: [...criteria, newCriterion.trim()] });
            setNewCriterion("");
        }
    };

    const updateLevelLabel = (index, label) => {
        const newLevels = [...(levels.length > 0 ? levels : defaultLevels)];
        newLevels[index] = { ...newLevels[index], label };
        onChange({ levels: newLevels });
    };

    return (
        <Stack spacing={3}>
            {/* Rating Scale */}
            <Box>
                <Typography variant="subtitle2" gutterBottom>
                    Rating Scale (4-point)
                </Typography>
                <Grid container spacing={2}>
                    {(levels.length > 0 ? levels : defaultLevels).map(
                        (level, index) => (
                            <Grid size={{ xs: 6, sm: 3 }} key={index}>
                                <Box sx={{ textAlign: "center" }}>
                                    <Chip
                                        label={level.score}
                                        color="primary"
                                        sx={{ mb: 1 }}
                                    />
                                    <TextField
                                        value={level.label}
                                        onChange={(e) =>
                                            updateLevelLabel(
                                                index,
                                                e.target.value,
                                            )
                                        }
                                        size="small"
                                        fullWidth
                                    />
                                </Box>
                            </Grid>
                        ),
                    )}
                </Grid>
            </Box>

            {/* Criteria */}
            <Box>
                <Typography variant="subtitle2" gutterBottom>
                    Assessment Criteria
                </Typography>
                <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    sx={{ mb: 2 }}
                >
                    {criteria.map((c, index) => (
                        <Chip
                            key={index}
                            label={c}
                            onDelete={() =>
                                onChange({
                                    criteria: criteria.filter(
                                        (_, i) => i !== index,
                                    ),
                                })
                            }
                        />
                    ))}
                </Stack>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                        placeholder="Add criterion (e.g., Communication)"
                        value={newCriterion}
                        onChange={(e) => setNewCriterion(e.target.value)}
                        size="small"
                        onKeyPress={(e) =>
                            e.key === "Enter" &&
                            (e.preventDefault(), addCriterion())
                        }
                    />
                    <Button
                        variant="outlined"
                        onClick={addCriterion}
                        disabled={!newCriterion.trim()}
                    >
                        Add
                    </Button>
                </Box>
            </Box>
        </Stack>
    );
}

/**
 * Checklist Builder
 */
function ChecklistBuilder({ items = [], onChange }) {
    const [newItem, setNewItem] = useState("");

    const addItem = () => {
        if (newItem.trim()) {
            const key = newItem.toLowerCase().replace(/\s+/g, "_");
            onChange({ items: [...items, { key, label: newItem.trim() }] });
            setNewItem("");
        }
    };

    return (
        <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
                Add items that students must pass (all items required for
                overall pass)
            </Typography>

            {items.length > 0 && (
                <Box sx={{ bgcolor: "grey.50", borderRadius: 1, p: 2 }}>
                    {items.map((item, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                py: 1,
                                borderBottom:
                                    index < items.length - 1
                                        ? "1px solid"
                                        : "none",
                                borderColor: "divider",
                            }}
                        >
                            <Typography sx={{ flex: 1 }}>
                                {item.label}
                            </Typography>
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                    onChange({
                                        items: items.filter(
                                            (_, i) => i !== index,
                                        ),
                                    })
                                }
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            )}

            <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                    placeholder="Add checklist item"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    size="small"
                    fullWidth
                    onKeyPress={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addItem())
                    }
                />
                <Button
                    variant="outlined"
                    onClick={addItem}
                    disabled={!newItem.trim()}
                >
                    Add
                </Button>
            </Box>
        </Stack>
    );
}

/**
 * Simple Builders for Percentage and Pass/Fail
 */
function PercentageBuilder({ passMark, onChange }) {
    return (
        <Box>
            <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 2 }}
            >
                Students will receive a single percentage score (0-100)
            </Typography>
            <TextField
                label="Pass Mark (%)"
                type="number"
                value={passMark || 50}
                onChange={(e) =>
                    onChange({ pass_mark: parseInt(e.target.value) || 0 })
                }
                inputProps={{ min: 0, max: 100 }}
                size="small"
            />
        </Box>
    );
}

function PassFailBuilder() {
    return (
        <Alert severity="info">
            Students will receive a simple Pass or Fail result. No additional
            configuration needed.
        </Alert>
    );
}

/**
 * Main GradingSchemaBuilder Component
 */
export default function GradingSchemaBuilder({ value = {}, onChange }) {
    const gradingType = value.type || value.mode || "percentage";

    const handleTypeChange = (newType) => {
        // Reset config when type changes
        const baseConfig = { type: newType };

        // Add default values based on type
        switch (newType) {
            case "weighted":
                baseConfig.components = [];
                baseConfig.pass_mark = 50;
                break;
            case "competency":
                baseConfig.levels = [
                    { key: "nyc", label: "Not Yet Competent", passing: false },
                    { key: "c", label: "Competent", passing: true },
                ];
                baseConfig.components = [];
                break;
            case "rubric":
                baseConfig.levels = [
                    { score: 1, label: "Below Expectations" },
                    { score: 2, label: "Approaching" },
                    { score: 3, label: "Meeting" },
                    { score: 4, label: "Exceeding" },
                ];
                baseConfig.criteria = [];
                break;
            case "checklist":
                baseConfig.items = [];
                break;
            case "percentage":
                baseConfig.pass_mark = 50;
                break;
            case "pass_fail":
                // No additional config
                break;
        }

        onChange(baseConfig);
    };

    const handleConfigChange = (updates) => {
        onChange({ ...value, ...updates });
    };

    const selectedType = GRADING_TYPES.find((t) => t.value === gradingType);

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Grading Configuration
                </Typography>

                <Stack spacing={3}>
                    {/* Type Selector */}
                    <FormControl fullWidth>
                        <InputLabel>Grading Type</InputLabel>
                        <Select
                            value={gradingType}
                            label="Grading Type"
                            onChange={(e) => handleTypeChange(e.target.value)}
                        >
                            {GRADING_TYPES.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                    <Box>
                                        <Typography>{type.label}</Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {type.description}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {selectedType && (
                        <Alert severity="info" icon={<InfoIcon />}>
                            {selectedType.description}
                        </Alert>
                    )}

                    <Divider />

                    {/* Type-specific Builder */}
                    {gradingType === "weighted" && (
                        <WeightedBuilder
                            components={value.components || []}
                            passMark={value.pass_mark}
                            onChange={handleConfigChange}
                        />
                    )}

                    {gradingType === "competency" && (
                        <CompetencyBuilder
                            levels={value.levels || []}
                            components={value.components || []}
                            onChange={handleConfigChange}
                        />
                    )}

                    {gradingType === "rubric" && (
                        <RubricBuilder
                            levels={value.levels || []}
                            criteria={value.criteria || []}
                            onChange={handleConfigChange}
                        />
                    )}

                    {gradingType === "checklist" && (
                        <ChecklistBuilder
                            items={value.items || []}
                            onChange={handleConfigChange}
                        />
                    )}

                    {gradingType === "percentage" && (
                        <PercentageBuilder
                            passMark={value.pass_mark}
                            onChange={handleConfigChange}
                        />
                    )}

                    {gradingType === "pass_fail" && <PassFailBuilder />}
                </Stack>
            </CardContent>
        </Card>
    );
}
