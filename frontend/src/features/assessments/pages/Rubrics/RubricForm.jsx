import React, { useState, useEffect } from "react";
import { useForm, Link } from "@inertiajs/react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    TextField,
    Typography,
    IconButton,
    MenuItem,
    InputAdornment,
    Stack,
    Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const SCOPE_CHOICES = [
    { value: "course", label: "Course (Private)" },
    { value: "program", label: "Program (Shared)" },
    { value: "global", label: "Global (Standard)" },
];

export default function RubricForm({ rubric = null }) {
    const isEdit = !!rubric;

    // Initial dimensions if creating new
    const initialDimensions = rubric?.dimensions || [
        { name: "Criteria 1", weight: 1, max_score: 10 },
    ];

    const { data, setData, post, processing, errors } = useForm({
        name: rubric?.name || "",
        description: rubric?.description || "",
        scope: rubric?.scope || "course",
        max_score: rubric?.max_score || 100,
        dimensions: initialDimensions,
        // Program ID would be needed if scope is 'program' and user has choices
        // For now, we assume backend handles assignment or defaults
    });

    // Helper to update a specific dimension
    const updateDimension = (index, field, value) => {
        const newDimensions = [...data.dimensions];
        newDimensions[index] = { ...newDimensions[index], [field]: value };
        setData("dimensions", newDimensions);
    };

    // Helper to add/remove dimensions
    const addDimension = () => {
        setData("dimensions", [
            ...data.dimensions,
            { name: "", weight: 1, max_score: 10 },
        ]);
    };

    const removeDimension = (index) => {
        if (data.dimensions.length <= 1) return; // Prevent empty
        const newDimensions = data.dimensions.filter((_, i) => i !== index);
        setData("dimensions", newDimensions);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const url = isEdit
            ? `/assessments/rubrics/${rubric.id}/edit/`
            : "/assessments/rubrics/create/";

        post(url);
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ maxWidth: 800, mx: "auto" }}
        >
            <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
                <IconButton component={Link} href="/assessments/rubrics/">
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4">
                    {isEdit ? "Edit Rubric" : "Create Rubric"}
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Basic Info */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Stack spacing={3}>
                                <TextField
                                    label="Rubric Name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    error={!!errors.name}
                                    helperText={errors.name}
                                    fullWidth
                                    required
                                />

                                <TextField
                                    label="Description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData("description", e.target.value)
                                    }
                                    error={!!errors.description}
                                    helperText={errors.description}
                                    multiline
                                    rows={3}
                                    fullWidth
                                />

                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            select
                                            label="Scope"
                                            value={data.scope}
                                            onChange={(e) =>
                                                setData("scope", e.target.value)
                                            }
                                            error={!!errors.scope}
                                            helperText={errors.scope}
                                            fullWidth
                                        >
                                            {SCOPE_CHOICES.map((opt) => (
                                                <MenuItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Max Total Score"
                                            type="number"
                                            value={data.max_score}
                                            onChange={(e) =>
                                                setData(
                                                    "max_score",
                                                    e.target.value,
                                                )
                                            }
                                            error={!!errors.max_score}
                                            helperText={errors.max_score}
                                            fullWidth
                                            required
                                        />
                                    </Grid>
                                </Grid>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Dimensions Builder */}
                <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Dimensions
                    </Typography>

                    {errors.dimensions && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {errors.dimensions}
                        </Alert>
                    )}

                    <Stack spacing={2}>
                        {data.dimensions.map((dim, index) => (
                            <Card key={index} variant="outlined">
                                <CardContent>
                                    <Grid
                                        container
                                        spacing={2}
                                        alignItems="flex-start"
                                    >
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label={`Criteria ${index + 1}`}
                                                value={dim.name}
                                                onChange={(e) =>
                                                    updateDimension(
                                                        index,
                                                        "name",
                                                        e.target.value,
                                                    )
                                                }
                                                fullWidth
                                                required
                                                size="small"
                                                placeholder="e.g., Clarity, Accuracy"
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={2}>
                                            <TextField
                                                label="Weight"
                                                type="number"
                                                value={dim.weight}
                                                onChange={(e) =>
                                                    updateDimension(
                                                        index,
                                                        "weight",
                                                        e.target.value,
                                                    )
                                                }
                                                fullWidth
                                                required
                                                size="small"
                                                inputProps={{
                                                    step: "0.1",
                                                    min: "0",
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={2}>
                                            <TextField
                                                label="Max Pts"
                                                type="number"
                                                value={dim.max_score}
                                                onChange={(e) =>
                                                    updateDimension(
                                                        index,
                                                        "max_score",
                                                        e.target.value,
                                                    )
                                                }
                                                fullWidth
                                                required
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid
                                            item
                                            xs={12}
                                            sm={2}
                                            sx={{
                                                display: "flex",
                                                justifyContent: "flex-end",
                                            }}
                                        >
                                            <IconButton
                                                color="error"
                                                onClick={() =>
                                                    removeDimension(index)
                                                }
                                                disabled={
                                                    data.dimensions.length === 1
                                                }
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}

                        <Button
                            startIcon={<AddIcon />}
                            onClick={addDimension}
                            variant="outlined"
                        >
                            Add Criteria
                        </Button>
                    </Stack>
                </Grid>

                {/* Submit */}
                <Grid item xs={12}>
                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        startIcon={<SaveIcon />}
                        disabled={processing}
                        fullWidth
                    >
                        {processing
                            ? "Saving..."
                            : isEdit
                              ? "Update Rubric"
                              : "Create Rubric"}
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}
