/**
 * Admin Program Create/Edit Form Page
 * Requirements: US-3.1, US-3.2, US-3.4
 */

import { Head, Link, useForm } from "@inertiajs/react";
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    TextField,
    FormControlLabel,
    Switch,
    Stack,
    Chip,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Autocomplete,
} from "@mui/material";
import { motion } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import DashboardLayout from "@/layouts/DashboardLayout";

export default function ProgramForm({
    mode = "create",
    program = null,
    blueprints = [],
    instructors = [],
    courseLevels = [],
    currentInstructorIds = [],
    canChangeBlueprint = true,
    errors = {},
    formData = {},
}) {
    const isEdit = mode === "edit";

    // Auto-select first blueprint if only one exists or none selected
    const defaultBlueprintId =
        program?.blueprintId ||
        formData.blueprintId ||
        (blueprints.length === 1 ? blueprints[0].id : "");

    const { data, setData, post, processing } = useForm({
        name: program?.name || formData.name || "",
        code: program?.code || formData.code || "",
        level: program?.level || formData.level || "",
        description: program?.description || formData.description || "",
        blueprintId: defaultBlueprintId,
        instructorIds: currentInstructorIds || formData.instructorIds || [],
        isPublished: program?.isPublished || formData.isPublished || false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            post(`/admin/programs/${program.id}/edit/`);
        } else {
            post("/admin/programs/create/");
        }
    };

    const selectedBlueprint = blueprints.find((b) => b.id === data.blueprintId);

    return (
        <DashboardLayout
            role="admin"
            breadcrumbs={[
                { label: "Programs", href: "/admin/programs/" },
                ...(isEdit
                    ? [
                          {
                              label: program.name,
                              href: `/admin/programs/${program.id}/`,
                          },
                          { label: "Edit" },
                      ]
                    : [{ label: "Create" }]),
            ]}
        >
            <Head title={isEdit ? `Edit: ${program.name}` : "Create Program"} />

            <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    {/* Header */}
                    <Box>
                        <Button
                            component={Link}
                            href={
                                isEdit
                                    ? `/admin/programs/${program.id}/`
                                    : "/admin/programs/"
                            }
                            startIcon={<ArrowBackIcon />}
                            sx={{ mb: 1 }}
                        >
                            {isEdit ? "Back to Program" : "Back to Programs"}
                        </Button>
                        <Typography variant="h4" fontWeight="bold">
                            {isEdit ? "Edit Program" : "Create Program"}
                        </Typography>
                    </Box>

                    {errors._form && (
                        <Alert severity="error">{errors._form}</Alert>
                    )}

                    <Grid container spacing={3}>
                        {/* Basic Info */}
                        <Grid item xs={12} md={8}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Basic Information
                                        </Typography>
                                        <Stack spacing={3}>
                                            <TextField
                                                label="Program Name"
                                                value={data.name}
                                                onChange={(e) =>
                                                    setData(
                                                        "name",
                                                        e.target.value,
                                                    )
                                                }
                                                error={!!errors.name}
                                                helperText={errors.name}
                                                fullWidth
                                                required
                                            />
                                            <TextField
                                                label="Program Code"
                                                value={data.code}
                                                onChange={(e) =>
                                                    setData(
                                                        "code",
                                                        e.target.value,
                                                    )
                                                }
                                                error={!!errors.code}
                                                helperText={
                                                    errors.code ||
                                                    "Optional unique identifier"
                                                }
                                                fullWidth
                                            />
                                            
                                            <FormControl fullWidth required error={!!errors.level}>
                                                <InputLabel>Level</InputLabel>
                                                <Select
                                                    value={data.level}
                                                    label="Level"
                                                    onChange={(e) => setData("level", e.target.value)}
                                                >
                                                    {courseLevels.map((level) => (
                                                        <MenuItem key={level.value} value={level.value}>
                                                            {level.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                {errors.level && (
                                                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                                        {errors.level}
                                                    </Typography>
                                                )}
                                            </FormControl>
                                            <TextField
                                                label="Description"
                                                value={data.description}
                                                onChange={(e) =>
                                                    setData(
                                                        "description",
                                                        e.target.value,
                                                    )
                                                }
                                                multiline
                                                rows={4}
                                                fullWidth
                                            />
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Grid>

                        {/* Settings - Published toggle removed for Draft-First Workflow */}
                        
                        {/* Blueprint Selection - Hidden if only one blueprint (auto-selected) */}
                        {blueprints.length > 1 && (
                            <Grid item xs={12}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Card>
                                        <CardContent>
                                            <Typography
                                                variant="h6"
                                                gutterBottom
                                            >
                                                Academic Blueprint
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ mb: 2 }}
                                            >
                                                Select the blueprint that
                                                defines the academic structure
                                                for this program
                                            </Typography>

                                            {!canChangeBlueprint && (
                                                <Alert
                                                    severity="info"
                                                    sx={{ mb: 2 }}
                                                >
                                                    Blueprint cannot be changed
                                                    because this program has
                                                    enrollments.
                                                </Alert>
                                            )}

                                            <FormControl
                                                fullWidth
                                                error={!!errors.blueprintId}
                                            >
                                                <InputLabel>
                                                    Blueprint
                                                </InputLabel>
                                                <Select
                                                    value={data.blueprintId}
                                                    label="Blueprint"
                                                    onChange={(e) =>
                                                        setData(
                                                            "blueprintId",
                                                            e.target.value,
                                                        )
                                                    }
                                                    disabled={
                                                        !canChangeBlueprint
                                                    }
                                                    required
                                                >
                                                    {blueprints.map((bp) => (
                                                        <MenuItem
                                                            key={bp.id}
                                                            value={bp.id}
                                                        >
                                                            {bp.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                {errors.blueprintId && (
                                                    <Typography
                                                        variant="caption"
                                                        color="error"
                                                        sx={{ mt: 0.5 }}
                                                    >
                                                        {errors.blueprintId}
                                                    </Typography>
                                                )}
                                            </FormControl>

                                            {/* Blueprint Preview */}
                                            {selectedBlueprint && (
                                                <Box
                                                    sx={{
                                                        mt: 2,
                                                        p: 2,
                                                        bgcolor: "grey.50",
                                                        borderRadius: 1,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="subtitle2"
                                                        gutterBottom
                                                    >
                                                        Hierarchy Structure
                                                    </Typography>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        flexWrap="wrap"
                                                    >
                                                        {selectedBlueprint.hierarchyLabels?.map(
                                                            (label, i) => (
                                                                <Box
                                                                    key={i}
                                                                    sx={{
                                                                        display:
                                                                            "flex",
                                                                        alignItems:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    <Chip
                                                                        label={
                                                                            label
                                                                        }
                                                                        size="small"
                                                                        color="primary"
                                                                        variant="outlined"
                                                                    />
                                                                    {i <
                                                                        selectedBlueprint
                                                                            .hierarchyLabels
                                                                            .length -
                                                                            1 && (
                                                                        <Typography
                                                                            sx={{
                                                                                mx: 0.5,
                                                                            }}
                                                                            color="text.secondary"
                                                                        >
                                                                            →
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            ),
                                                        )}
                                                    </Stack>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </Grid>
                        )}

                        {/* Instructors */}
                        <Grid item xs={12}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Assign Instructors (Optional)
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mb: 2 }}
                                        >
                                            Select instructors who will teach
                                            this program. You can also assign
                                            them later.
                                        </Typography>

                                        <Autocomplete
                                            multiple
                                            options={instructors}
                                            getOptionLabel={(option) =>
                                                `${option.name} (${option.email})`
                                            }
                                            value={instructors.filter((i) =>
                                                data.instructorIds.includes(
                                                    i.id,
                                                ),
                                            )}
                                            onChange={(_, newValue) => {
                                                setData(
                                                    "instructorIds",
                                                    newValue.map((v) => v.id),
                                                );
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Instructors"
                                                    placeholder="Select instructors"
                                                />
                                            )}
                                            renderTags={(value, getTagProps) =>
                                                value.map((option, index) => (
                                                    <Chip
                                                        label={option.name}
                                                        {...getTagProps({
                                                            index,
                                                        })}
                                                        key={option.id}
                                                    />
                                                ))
                                            }
                                        />

                                        {instructors.length === 0 && (
                                            <Alert
                                                severity="info"
                                                sx={{ mt: 2 }}
                                            >
                                                No instructors available yet.
                                                You can create the program now
                                                and assign instructors later.
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Grid>
                    </Grid>

                    {/* Actions */}
                    <Box
                        sx={{
                            display: "flex",
                            gap: 2,
                            justifyContent: "flex-end",
                        }}
                    >
                        <Button
                            component={Link}
                            href={
                                isEdit
                                    ? `/admin/programs/${program.id}/`
                                    : "/admin/programs/"
                            }
                            variant="outlined"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={processing}
                        >
                            {processing
                                ? isEdit
                                    ? "Saving..."
                                    : "Creating..."
                                : isEdit
                                  ? "Save Changes"
                                  : "Create Draft & Continue"}
                        </Button>
                    </Box>
                </Stack>
            </Box>
        </DashboardLayout>
    );
}
