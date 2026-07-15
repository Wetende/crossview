/**
 * Admin Program Create/Edit Form Page
 * Requirements: US-3.1, US-3.2, US-3.4
 *
 * Supports cascading exam body dropdowns for TVET deployment mode.
 * Exam body registry is backend-driven (passed as props) so future
 * exam bodies can be added without changing this component.
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
    Stack,
    Chip,
    Alert,
    FormControl,
    FormControlLabel,
    Select,
    MenuItem,
    Autocomplete,
    Switch,
} from "@mui/material";
import { motion } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useEffect, useMemo } from "react";

import DashboardLayout from "@/layouts/DashboardLayout";

export default function ProgramForm({
    mode = "create",
    program = null,
    instructors = [],
    courseLevels = [],
    programCategories = [],
    currentInstructorIds = [],
    examBodyRegistry = {},
    deploymentMode = "custom",
    errors = {},
    formData = {},
    layoutRole = "admin",
    submitUrl = "",
    cancelUrl = "",
    showInstructorAssignment = true,
}) {
    const isEdit = mode === "edit";
    const isTvetMode = deploymentMode === "tvet";
    const hasExamBodies =
        isTvetMode && Object.keys(examBodyRegistry).length > 0;
    const isInstructorLayout = layoutRole === "instructor";
    const resolvedSubmitUrl =
        submitUrl ||
        (isEdit
            ? `/admin/programs/${program.id}/edit/`
            : "/admin/programs/create/");
    const resolvedCancelUrl =
        cancelUrl ||
        (isEdit ? `/admin/programs/${program.id}/` : "/admin/programs/");
    const pageTitle = isEdit ? "Edit Course" : "Create Course";
    const backLabel = isEdit ? "Back to Course" : "Back to Courses";

    const { data, setData, post, processing } = useForm({
        name: program?.name || formData.name || "",
        code: program?.code || formData.code || "",
        category: program?.category || formData.category || "",
        level: program?.level || formData.level || "",
        description: program?.description || formData.description || "",
        previewDescription:
            program?.previewDescription || formData.previewDescription || "",
        durationHours: program?.durationHours ?? formData.durationHours ?? 0,
        videoHours: program?.videoHours ?? formData.videoHours ?? 0,
        isFeatured: Boolean(program?.isFeatured || formData.isFeatured),
        lockLessonsInOrder:
            program?.lockLessonsInOrder ?? formData.lockLessonsInOrder ?? true,
        instructorIds:
            currentInstructorIds.length > 0
                ? currentInstructorIds
                : formData.instructorIds || [],
        // Exam body metadata
        examBody: program?.examBody || formData.examBody || "",
        qualificationFamily:
            program?.qualificationFamily || formData.qualificationFamily || "",
        awardType: program?.awardType || formData.awardType || "",
        assessmentMode:
            program?.assessmentMode || formData.assessmentMode || "",
    });

    // Derive available options from registry based on current selections
    const examBodies = useMemo(
        () => Object.keys(examBodyRegistry),
        [examBodyRegistry],
    );

    const selectedBodyData = useMemo(
        () => examBodyRegistry[data.examBody] || null,
        [examBodyRegistry, data.examBody],
    );

    const qualificationFamilies = useMemo(
        () =>
            selectedBodyData
                ? Object.keys(selectedBodyData.families || {})
                : [],
        [selectedBodyData],
    );

    const selectedFamilyData = useMemo(
        () => selectedBodyData?.families?.[data.qualificationFamily] || null,
        [selectedBodyData, data.qualificationFamily],
    );

    const registryLevels = useMemo(
        () => selectedFamilyData?.levels || [],
        [selectedFamilyData],
    );

    const categoryOptions = useMemo(() => {
        const configuredCategories = Array.isArray(programCategories)
            ? programCategories.filter(Boolean)
            : [];
        if (data.category && !configuredCategories.includes(data.category)) {
            return [data.category, ...configuredCategories];
        }
        return configuredCategories;
    }, [data.category, programCategories]);
    const hasConfiguredCategories =
        Array.isArray(programCategories) && programCategories.length > 0;

    // Auto-fill program metadata when family changes.
    useEffect(() => {
        if (selectedFamilyData) {
            setData((prev) => ({
                ...prev,
                awardType: selectedFamilyData.awardType || prev.awardType,
                assessmentMode:
                    selectedFamilyData.assessmentMode || prev.assessmentMode,
            }));
        }
    }, [data.qualificationFamily, selectedFamilyData, setData]);

    // Reset dependent fields when exam body changes
    const handleExamBodyChange = (value) => {
        setData({
            ...data,
            examBody: value,
            qualificationFamily: "",
            level: "",
            awardType: "",
            assessmentMode: "",
        });
    };

    // Reset level when qualification family changes.
    const handleFamilyChange = (value) => {
        setData({
            ...data,
            qualificationFamily: value,
            level: "",
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(resolvedSubmitUrl);
    };

    return (
        <DashboardLayout
            role={layoutRole}
            breadcrumbs={[
                {
                    label: isInstructorLayout ? "My Programs" : "Programs",
                    href: isInstructorLayout
                        ? "/instructor/programs/"
                        : "/admin/programs/",
                },
                ...(isEdit
                    ? [
                          {
                              label: program.name,
                              href: resolvedCancelUrl,
                          },
                          { label: "Edit" },
                      ]
                    : [{ label: "Create" }]),
            ]}
        >
            <Head title={isEdit ? `Edit: ${program.name}` : pageTitle} />

            <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    {/* Header */}
                    <Box>
                        <Button
                            component={Link}
                            href={resolvedCancelUrl}
                            startIcon={<ArrowBackIcon />}
                            sx={{ mb: 1 }}
                        >
                            {backLabel}
                        </Button>
                        <Typography variant="h4" fontWeight="bold">
                            {pageTitle}
                        </Typography>
                    </Box>

                    {errors._form && (
                        <Alert severity="error">{errors._form}</Alert>
                    )}

                    <Grid container spacing={3}>
                        {/* Top Row: Basic Info & Exam Body Details */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ height: "100%" }}
                            >
                                <Card sx={{ height: "100%" }}>
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            sx={{ mb: 3, fontWeight: 600 }}
                                        >
                                            Basic information
                                        </Typography>
                                        <Stack spacing={3}>
                                            <Box>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        mb: 1,
                                                        color: "text.secondary",
                                                    }}
                                                >
                                                    Course name *
                                                </Typography>
                                                <TextField
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
                                                    placeholder="Diploma in Information Technology"
                                                />
                                            </Box>
                                            <Box>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        mb: 1,
                                                        color: "text.secondary",
                                                    }}
                                                >
                                                    Course code *
                                                </Typography>
                                                <TextField
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
                                                        "Unique identifier for this course."
                                                    }
                                                    fullWidth
                                                    required
                                                    placeholder="e.g. DIT-2026"
                                                />
                                            </Box>
                                            <Box>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        mb: 1,
                                                        color: "text.secondary",
                                                    }}
                                                >
                                                    Category *
                                                </Typography>
                                                <FormControl
                                                    fullWidth
                                                    error={!!errors.category}
                                                    disabled={
                                                        categoryOptions.length ===
                                                        0
                                                    }
                                                    required={
                                                        hasConfiguredCategories
                                                    }
                                                >
                                                    <Select
                                                        value={data.category}
                                                        displayEmpty
                                                        required={
                                                            hasConfiguredCategories
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                "category",
                                                                e.target.value,
                                                            )
                                                        }
                                                    >
                                                        <MenuItem
                                                            value=""
                                                            disabled={
                                                                hasConfiguredCategories
                                                            }
                                                        >
                                                            <em>
                                                                {hasConfiguredCategories
                                                                    ? "Select category"
                                                                    : "No categories configured"}
                                                            </em>
                                                        </MenuItem>
                                                        {categoryOptions.map(
                                                            (category) => (
                                                                <MenuItem
                                                                    key={
                                                                        category
                                                                    }
                                                                    value={
                                                                        category
                                                                    }
                                                                >
                                                                    {category}
                                                                </MenuItem>
                                                            ),
                                                        )}
                                                    </Select>
                                                    {errors.category && (
                                                        <Typography
                                                            variant="caption"
                                                            color="error"
                                                            sx={{ mt: 0.5 }}
                                                        >
                                                            {errors.category}
                                                        </Typography>
                                                    )}
                                                </FormControl>
                                            </Box>
                                            <Stack
                                                direction={{
                                                    xs: "column",
                                                    sm: "row",
                                                }}
                                                spacing={2}
                                            >
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            mb: 1,
                                                            color: "text.secondary",
                                                        }}
                                                    >
                                                        Course duration
                                                    </Typography>
                                                    <TextField
                                                        type="number"
                                                        value={
                                                            data.durationHours
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                "durationHours",
                                                                e.target.value,
                                                            )
                                                        }
                                                        error={
                                                            !!errors.durationHours
                                                        }
                                                        helperText={
                                                            errors.durationHours ||
                                                            "Hours"
                                                        }
                                                        fullWidth
                                                        inputProps={{ min: 0 }}
                                                    />
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            mb: 1,
                                                            color: "text.secondary",
                                                        }}
                                                    >
                                                        Video duration
                                                    </Typography>
                                                    <TextField
                                                        type="number"
                                                        value={data.videoHours}
                                                        onChange={(e) =>
                                                            setData(
                                                                "videoHours",
                                                                e.target.value,
                                                            )
                                                        }
                                                        error={
                                                            !!errors.videoHours
                                                        }
                                                        helperText={
                                                            errors.videoHours ||
                                                            "Hours"
                                                        }
                                                        fullWidth
                                                        inputProps={{ min: 0 }}
                                                    />
                                                </Box>
                                            </Stack>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={
                                                            data.lockLessonsInOrder
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                "lockLessonsInOrder",
                                                                e.target
                                                                    .checked,
                                                            )
                                                        }
                                                    />
                                                }
                                                label="Lock lessons in order"
                                            />
                                            {!isInstructorLayout && (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={
                                                                data.isFeatured
                                                            }
                                                            onChange={(e) =>
                                                                setData(
                                                                    "isFeatured",
                                                                    e.target
                                                                        .checked,
                                                                )
                                                            }
                                                        />
                                                    }
                                                    label="Featured course"
                                                />
                                            )}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                style={{ height: "100%" }}
                            >
                                <Card sx={{ height: "100%" }}>
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            sx={{ mb: 3, fontWeight: 600 }}
                                        >
                                            {isTvetMode
                                                ? "Examining body details"
                                                : "Course details"}
                                        </Typography>
                                        <Stack spacing={3}>
                                            {/* Exam Body (shown if TVET) */}
                                            {hasExamBodies && (
                                                <Box>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            mb: 1,
                                                            color: "text.secondary",
                                                        }}
                                                    >
                                                        Examining body
                                                    </Typography>
                                                    <FormControl fullWidth>
                                                        <Select
                                                            value={
                                                                data.examBody
                                                            }
                                                            displayEmpty
                                                            onChange={(e) =>
                                                                handleExamBodyChange(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        >
                                                            <MenuItem
                                                                value=""
                                                                disabled
                                                            >
                                                                <em>
                                                                    Select
                                                                    examining
                                                                    body
                                                                </em>
                                                            </MenuItem>
                                                            {examBodies.map(
                                                                (body) => (
                                                                    <MenuItem
                                                                        key={
                                                                            body
                                                                        }
                                                                        value={
                                                                            body
                                                                        }
                                                                    >
                                                                        {
                                                                            examBodyRegistry[
                                                                                body
                                                                            ]
                                                                                .label
                                                                        }
                                                                    </MenuItem>
                                                                ),
                                                            )}
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                            )}

                                            {/* Level dropdown (Hidden if exam body handles it) */}
                                            {(!hasExamBodies ||
                                                !data.examBody) && (
                                                <Box>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            mb: 1,
                                                            color: "text.secondary",
                                                        }}
                                                    >
                                                        Level
                                                    </Typography>
                                                    <FormControl
                                                        fullWidth
                                                        error={!!errors.level}
                                                    >
                                                        <Select
                                                            value={data.level}
                                                            displayEmpty
                                                            onChange={(e) =>
                                                                setData(
                                                                    "level",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        >
                                                            <MenuItem value="">
                                                                <em>
                                                                    Select level
                                                                </em>
                                                            </MenuItem>
                                                            {courseLevels.map(
                                                                (level) => (
                                                                    <MenuItem
                                                                        key={
                                                                            level.value
                                                                        }
                                                                        value={
                                                                            level.value
                                                                        }
                                                                    >
                                                                        {
                                                                            level.label
                                                                        }
                                                                    </MenuItem>
                                                                ),
                                                            )}
                                                        </Select>
                                                        {errors.level && (
                                                            <Typography
                                                                variant="caption"
                                                                color="error"
                                                                sx={{ mt: 0.5 }}
                                                            >
                                                                {errors.level}
                                                            </Typography>
                                                        )}
                                                    </FormControl>
                                                </Box>
                                            )}

                                            {/* Step 2: Select Qualification Family */}
                                            {hasExamBodies && data.examBody && (
                                                <Box>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            mb: 1,
                                                            color: "text.secondary",
                                                        }}
                                                    >
                                                        Qualification Family
                                                    </Typography>
                                                    <FormControl fullWidth>
                                                        <Select
                                                            value={
                                                                data.qualificationFamily
                                                            }
                                                            displayEmpty
                                                            onChange={(e) =>
                                                                handleFamilyChange(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        >
                                                            <MenuItem value="">
                                                                <em>
                                                                    Select
                                                                    qualification
                                                                    family...
                                                                </em>
                                                            </MenuItem>
                                                            {qualificationFamilies.map(
                                                                (family) => (
                                                                    <MenuItem
                                                                        key={
                                                                            family
                                                                        }
                                                                        value={
                                                                            family
                                                                        }
                                                                    >
                                                                        {family}
                                                                    </MenuItem>
                                                                ),
                                                            )}
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                            )}

                                            {/* Step 3: Select Level */}
                                            {hasExamBodies &&
                                                data.qualificationFamily &&
                                                registryLevels.length > 0 && (
                                                    <Box>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                mb: 1,
                                                                color: "text.secondary",
                                                            }}
                                                        >
                                                            Level
                                                        </Typography>
                                                        <FormControl fullWidth>
                                                            <Select
                                                                value={
                                                                    data.level
                                                                }
                                                                displayEmpty
                                                                onChange={(e) =>
                                                                    setData(
                                                                        "level",
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                            >
                                                                <MenuItem value="">
                                                                    <em>
                                                                        Select
                                                                        level...
                                                                    </em>
                                                                </MenuItem>
                                                                {registryLevels.map(
                                                                    (level) => (
                                                                        <MenuItem
                                                                            key={
                                                                                level
                                                                            }
                                                                            value={
                                                                                level
                                                                            }
                                                                        >
                                                                            {
                                                                                level
                                                                            }
                                                                        </MenuItem>
                                                                    ),
                                                                )}
                                                            </Select>
                                                        </FormControl>
                                                    </Box>
                                                )}

                                            {hasExamBodies && (
                                                <>
                                                    <Box>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                mb: 1,
                                                                color: "text.secondary",
                                                            }}
                                                        >
                                                            Award type
                                                        </Typography>
                                                        <TextField
                                                            value={
                                                                data.awardType
                                                            }
                                                            onChange={(e) =>
                                                                setData(
                                                                    "awardType",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            fullWidth
                                                            placeholder="e.g. Diploma, Certificate, Trade Test"
                                                        />
                                                    </Box>
                                                    <Box>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                mb: 1,
                                                                color: "text.secondary",
                                                            }}
                                                        >
                                                            Assessment mode
                                                        </Typography>
                                                        <TextField
                                                            value={
                                                                data.assessmentMode
                                                            }
                                                            onChange={(e) =>
                                                                setData(
                                                                    "assessmentMode",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            fullWidth
                                                            placeholder="e.g. Exam, CBET, Continuous Assessment"
                                                        />
                                                    </Box>
                                                </>
                                            )}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Grid>

                        {/* Description */}
                        <Grid size={{ xs: 12 }}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card>
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            sx={{ mb: 3, fontWeight: 600 }}
                                        >
                                            Description
                                        </Typography>
                                        <TextField
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
                                            placeholder="Briefly describe this course"
                                            sx={{
                                                "& .MuiInputBase-root": {
                                                    p: 2,
                                                },
                                            }}
                                        />
                                        <TextField
                                            value={data.previewDescription}
                                            onChange={(e) =>
                                                setData(
                                                    "previewDescription",
                                                    e.target.value,
                                                )
                                            }
                                            multiline
                                            rows={3}
                                            fullWidth
                                            placeholder="Short preview description for cards and summaries"
                                            sx={{ mt: 3 }}
                                        />
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Grid>

                        {/* Instructors */}
                        {showInstructorAssignment && (
                            <Grid size={{ xs: 12 }}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <Card>
                                        <CardContent>
                                            <Typography
                                                variant="h6"
                                                sx={{ mb: 1, fontWeight: 600 }}
                                            >
                                                Assign instructors (optional)
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ mb: 3 }}
                                            >
                                                Select instructors who will
                                                teach this course. You can also
                                                assign them later.
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
                                                        newValue.map(
                                                            (v) => v.id,
                                                        ),
                                                    );
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Instructors"
                                                        placeholder="Select instructors"
                                                    />
                                                )}
                                                renderTags={(
                                                    value,
                                                    getTagProps,
                                                ) =>
                                                    value.map(
                                                        (option, index) => (
                                                            <Chip
                                                                label={
                                                                    option.name
                                                                }
                                                                {...getTagProps(
                                                                    {
                                                                        index,
                                                                    },
                                                                )}
                                                                key={option.id}
                                                            />
                                                        ),
                                                    )
                                                }
                                            />

                                            {instructors.length === 0 && (
                                                <Alert
                                                    severity="info"
                                                    sx={{ mt: 2 }}
                                                >
                                                    No instructors available
                                                    yet. You can create the
                                                    course now and assign
                                                    instructors later.
                                                </Alert>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </Grid>
                        )}
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
                            href={resolvedCancelUrl}
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
