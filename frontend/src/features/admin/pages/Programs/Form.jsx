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
    Divider,
} from "@mui/material";
import { motion } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useState, useEffect, useMemo } from "react";

import DashboardLayout from "@/layouts/DashboardLayout";

export default function ProgramForm({
    mode = "create",
    program = null,
    blueprints = [],
    instructors = [],
    courseLevels = [],
    currentInstructorIds = [],
    canChangeBlueprint = true,
    examBodyRegistry = {},
    deploymentMode = "custom",
    errors = {},
    formData = {},
}) {
    const isEdit = mode === "edit";
    const isTvetMode = deploymentMode === "tvet";
    const hasExamBodies = isTvetMode && Object.keys(examBodyRegistry).length > 0;

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
        // Exam body metadata
        examBody: program?.examBody || formData.examBody || "",
        qualificationFamily: program?.qualificationFamily || formData.qualificationFamily || "",
        officialLevel: program?.officialLevel || formData.officialLevel || "",
        awardType: program?.awardType || formData.awardType || "",
        approvalStatus: program?.approvalStatus || formData.approvalStatus || "",
        assessmentMode: program?.assessmentMode || formData.assessmentMode || "",
        centreStatus: program?.centreStatus || formData.centreStatus || "",
        kenyaRecognitionStatus: program?.kenyaRecognitionStatus || formData.kenyaRecognitionStatus || "",
        sourceDocument: program?.sourceDocument || formData.sourceDocument || "",
    });

    // Derive available options from registry based on current selections
    const examBodies = useMemo(() => Object.keys(examBodyRegistry), [examBodyRegistry]);

    const selectedBodyData = useMemo(
        () => examBodyRegistry[data.examBody] || null,
        [examBodyRegistry, data.examBody]
    );

    const qualificationFamilies = useMemo(
        () => (selectedBodyData ? Object.keys(selectedBodyData.families) : []),
        [selectedBodyData]
    );

    const selectedFamilyData = useMemo(
        () => selectedBodyData?.families?.[data.qualificationFamily] || null,
        [selectedBodyData, data.qualificationFamily]
    );

    const officialLevels = useMemo(
        () => selectedFamilyData?.levels || [],
        [selectedFamilyData]
    );

    const suggestedCourses = useMemo(
        () => selectedFamilyData?.courses || [],
        [selectedFamilyData]
    );

    // Auto-fill broad category (level), award type, assessment mode when family changes
    useEffect(() => {
        if (selectedFamilyData) {
            setData((prev) => ({
                ...prev,
                level: selectedFamilyData.broadCategory || prev.level,
                awardType: selectedFamilyData.awardType || prev.awardType,
                assessmentMode: selectedFamilyData.assessmentMode || prev.assessmentMode,
            }));

            // Auto-select blueprint based on exam body
            const targetBlueprintCode = selectedFamilyData.blueprintCode || selectedBodyData?.blueprintCode;
            if (targetBlueprintCode) {
                // Map the internal code to the actual string that appears in the default blueprint name
                const matchString = targetBlueprintCode
                    .replace("nita_trade", "nita trade")
                    .replace("icm_exam", "icm exam")
                    .replace("icm_professional", "icm professional")
                    .toLowerCase();

                const matchingBlueprint = blueprints.find(
                    (bp) => bp.name?.toLowerCase().includes(matchString)
                );
                if (matchingBlueprint && canChangeBlueprint) {
                    setData((prev) => ({ ...prev, blueprintId: matchingBlueprint.id }));
                }
            }
        }
    }, [data.qualificationFamily, selectedFamilyData]);

    // Reset dependent fields when exam body changes
    const handleExamBodyChange = (value) => {
        setData({
            ...data,
            examBody: value,
            qualificationFamily: "",
            officialLevel: "",
            awardType: "",
            assessmentMode: "",
        });
    };

    // Reset official level when qualification family changes
    const handleFamilyChange = (value) => {
        setData({
            ...data,
            qualificationFamily: value,
            officialLevel: "",
        });
    };

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
                        {/* Top Row: Basic Info & Exam Body Details */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ height: "100%" }}
                            >
                                <Card sx={{ height: "100%" }}>
                                    <CardContent>
                                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                                            Basic information
                                        </Typography>
                                        <Stack spacing={3}>
                                            <Box>
                                                <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>Program name *</Typography>
                                                <TextField
                                                    value={data.name}
                                                    onChange={(e) => setData("name", e.target.value)}
                                                    error={!!errors.name}
                                                    helperText={errors.name}
                                                    fullWidth
                                                    required
                                                    placeholder="Diploma in Information Technology"
                                                />
                                            </Box>
                                            <Box>
                                                <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>Program code</Typography>
                                                <TextField
                                                    value={data.code}
                                                    onChange={(e) => setData("code", e.target.value)}
                                                    error={!!errors.code}
                                                    helperText={errors.code || "Optional unique identifier"}
                                                    fullWidth
                                                    placeholder="e.g. DIT-2026"
                                                />
                                            </Box>
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
                                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                                            Examining body details
                                        </Typography>
                                        <Stack spacing={3}>
                                            {/* Exam Body (shown if TVET) */}
                                            {hasExamBodies && (
                                                <Box>
                                                    <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>Examining body</Typography>
                                                    <FormControl fullWidth>
                                                        <Select
                                                            value={data.examBody}
                                                            displayEmpty
                                                            onChange={(e) => handleExamBodyChange(e.target.value)}
                                                        >
                                                            <MenuItem value="" disabled>
                                                                <em>Select examining body</em>
                                                            </MenuItem>
                                                            {examBodies.map((body) => (
                                                                <MenuItem key={body} value={body}>
                                                                    {examBodyRegistry[body].label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                            )}

                                            {/* Level dropdown (Hidden if exam body handles it) */}
                                            {(!hasExamBodies || !data.examBody) && (
                                                <Box>
                                                    <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>Level *</Typography>
                                                    <FormControl fullWidth required error={!!errors.level}>
                                                        <Select
                                                            value={data.level}
                                                            displayEmpty
                                                            onChange={(e) => setData("level", e.target.value)}
                                                        >
                                                            <MenuItem value="" disabled>
                                                                <em>Select level</em>
                                                            </MenuItem>
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
                                                </Box>
                                            )}

                                            {/* Step 2: Select Qualification Family */}
                                            {hasExamBodies && data.examBody && (
                                                <Box>
                                                    <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>Qualification Family</Typography>
                                                    <FormControl fullWidth>
                                                        <Select
                                                            value={data.qualificationFamily}
                                                            displayEmpty
                                                            onChange={(e) => handleFamilyChange(e.target.value)}
                                                        >
                                                            <MenuItem value="" disabled>
                                                                <em>Select qualification family...</em>
                                                            </MenuItem>
                                                            {qualificationFamilies.map((family) => (
                                                                <MenuItem key={family} value={family}>
                                                                    {family}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                            )}

                                            {/* Step 3: Select Official Level */}
                                            {hasExamBodies && data.qualificationFamily && officialLevels.length > 0 && (
                                                <Box>
                                                    <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>Official Level / Stage</Typography>
                                                    <FormControl fullWidth>
                                                        <Select
                                                            value={data.officialLevel}
                                                            displayEmpty
                                                            onChange={(e) => setData("officialLevel", e.target.value)}
                                                        >
                                                            <MenuItem value="" disabled>
                                                                <em>Select level...</em>
                                                            </MenuItem>
                                                            {officialLevels.map((level) => (
                                                                <MenuItem key={level} value={level}>
                                                                    {level}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                            )}

                                            {/* Additional TVET Metadata */}
                                            {hasExamBodies && data.qualificationFamily && (
                                                <>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>Centre Approval Status</Typography>
                                                        <TextField
                                                            value={data.centreStatus}
                                                            onChange={(e) => setData("centreStatus", e.target.value)}
                                                            helperText="e.g. Approved, Pending, Internal Preparation"
                                                            fullWidth
                                                        />
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>TVETA Recognition Status</Typography>
                                                        <TextField
                                                            value={data.kenyaRecognitionStatus}
                                                            onChange={(e) => setData("kenyaRecognitionStatus", e.target.value)}
                                                            fullWidth
                                                        />
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>Source Document/Reference</Typography>
                                                        <TextField
                                                            value={data.sourceDocument}
                                                            onChange={(e) => setData("sourceDocument", e.target.value)}
                                                            fullWidth
                                                        />
                                                    </Box>
                                                </>
                                            )}

                                            {/* Course Suggestions (if available) */}
                                            {hasExamBodies && suggestedCourses.length > 0 && (
                                                <Alert severity="info" variant="outlined" sx={{ mt: -1 }}>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Available Courses:
                                                    </Typography>
                                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                        {suggestedCourses.map((course) => (
                                                            <Chip
                                                                key={course.code}
                                                                label={`${course.code} — ${course.name}`}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        ))}
                                                    </Stack>
                                                </Alert>
                                            )}

                                            {/* Auto-filled metadata preview */}
                                            {hasExamBodies && data.awardType && (
                                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                    {data.awardType && (
                                                        <Chip
                                                            label={`Award: ${data.awardType}`}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                    {data.assessmentMode && (
                                                        <Chip
                                                            label={`Assessment: ${data.assessmentMode}`}
                                                            size="small"
                                                            color="secondary"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                    {data.level && (
                                                        <Chip
                                                            label={`Category: ${data.level}`}
                                                            size="small"
                                                            color="success"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Stack>
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
                                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                                            Description
                                        </Typography>
                                        <TextField
                                            value={data.description}
                                            onChange={(e) => setData("description", e.target.value)}
                                            multiline
                                            rows={4}
                                            fullWidth
                                            placeholder="Briefly describe this program"
                                            sx={{ 
                                                '& .MuiInputBase-root': { 
                                                    p: 2 
                                                }
                                            }}
                                        />
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Grid>

                        {/* Settings - Published toggle removed for Draft-First Workflow */}
                        
                        {/* Blueprint Selection - Hidden if only one blueprint (auto-selected) */}
                        {blueprints.length > 1 && (
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
                        <Grid size={{ xs: 12 }}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                                            Assign instructors (optional)
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mb: 3 }}
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
