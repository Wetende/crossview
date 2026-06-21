import { useRef } from "react";
import { useForm, router, usePage } from "@inertiajs/react";
import {
    Box,
    Typography,
    Stack,
    Button,
    Alert,
    TextField,
    Switch,
    FormControlLabel,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
} from "@mui/material";
import {
    Delete as DeleteIcon,
    Upload as UploadIcon,
    Description as DocIcon,
} from "@mui/icons-material";
import { PricingEditor, FAQEditor, NoticeEditor } from "./SettingsEditors";
import DripEditor from "./DripEditor";
import RichTextEditor from "@/components/RichTextEditor";

export default function SettingsPanel({
    program,
    activeTab,
    curriculum,
    platformFeatures = {},
    deploymentMode = "custom",
}) {
    const { props } = usePage();
    const availablePrerequisites = props.availablePrerequisites || [];
    const courseLevels = props.courseLevels || [];
    const categories = props.platform?.programCategories || [];
    const fileInputRef = useRef(null);

    const {
        data: formData,
        setData,
        transform,
        post,
        processing,
        errors,
    } = useForm({
        description: program.description || "",
        whatYouLearn: program.whatYouLearnHtml || "",
        resources: program.resources || [],
        deleteResourceIds: [],
        materials: [],
        name: program.name || "",
        code: program.code || "",
        category: program.category || "",
        level: program.level || "",
        officialLevel: program.officialLevel || "",
        thumbnail: null,
        custom_pricing: program.customPricing || {},
        faq: program.faq || [],
        notices: program.notices || [],
        access_duration_days: program.accessDurationDays || null,
        prerequisites_enabled: program.prerequisitesEnabled || false,
        prerequisite_program_ids: program.prerequisiteProgramIds || [],
        drip_enabled: program.dripEnabled || false,
        drip_mode: program.dripMode || "none",
    });

    const getSubmitPayload = () => {
        switch (activeTab) {
            case "overview":
                return {
                    tab: activeTab,
                    description: formData.description,
                    whatYouLearn: formData.whatYouLearn,
                    deleteResourceIds: JSON.stringify(formData.deleteResourceIds || []),
                    materials: formData.materials,
                };
            case "settings": {
                const payload = {
                    tab: activeTab,
                    name: formData.name,
                    code: formData.code,
                    category: formData.category,
                    level: formData.level,
                    officialLevel: formData.officialLevel,
                };
                if (formData.thumbnail) {
                    payload.thumbnail = formData.thumbnail;
                }
                return payload;
            }
            case "pricing":
                return {
                    tab: activeTab,
                    custom_pricing: JSON.stringify(formData.custom_pricing || {}),
                };
            case "faq":
                return {
                    tab: activeTab,
                    faq: JSON.stringify(formData.faq || []),
                };
            case "notice":
                return {
                    tab: activeTab,
                    notices: JSON.stringify(formData.notices || []),
                };
            case "prerequisites":
                return {
                    tab: activeTab,
                    prerequisites_enabled: formData.prerequisites_enabled,
                    prerequisite_program_ids: JSON.stringify(
                        formData.prerequisite_program_ids || [],
                    ),
                };
            case "access":
                return {
                    tab: activeTab,
                    access_duration_days: formData.access_duration_days || "",
                };
            default:
                return { tab: activeTab };
        }
    };

    const handleSubmit = () => {
        transform(() => getSubmitPayload());
        post(`/instructor/programs/${program.id}/manage/settings/`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                if (activeTab === "overview") {
                    setData((current) => ({
                        ...current,
                        deleteResourceIds: [],
                        materials: [],
                    }));
                }
                if (activeTab === "settings") {
                    setData("thumbnail", null);
                }
            },
        });
    };

    const handleResourceUpload = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setData("materials", [...formData.materials, ...files]);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDeleteResource = (resourceId) => {
        setData("resources", formData.resources.filter((r) => r.id !== resourceId));
        setData("deleteResourceIds", [...formData.deleteResourceIds, resourceId]);
    };

    const renderContent = () => {
        switch (activeTab) {
            // --- Overview ---
            case "overview":
                return (
                    <Stack spacing={3}>
                        <Typography variant="h5" fontWeight="bold">
                            Course Overview
                        </Typography>
                        <Alert severity="info">
                            This content appears on the course welcome screen
                            students see when they enter your course.
                        </Alert>

                        <Typography variant="subtitle2" fontWeight="bold">
                            Course Description
                        </Typography>
                        <RichTextEditor
                            value={formData.description}
                            onChange={(val) => setData("description", val)}
                            minHeight={180}
                            placeholder="Introduce your course — what it covers, who it's for, and why students should take it..."
                        />

                        <Typography variant="subtitle2" fontWeight="bold">
                            What You&rsquo;ll Learn
                        </Typography>
                        <RichTextEditor
                            value={formData.whatYouLearn}
                            onChange={(val) => setData("whatYouLearn", val)}
                            minHeight={180}
                            placeholder="List the learning outcomes — what skills will students gain?"
                        />

                        <Typography variant="subtitle2" fontWeight="bold">
                            Course Resources
                        </Typography>
                        <Alert severity="info" sx={{ mb: 1 }}>
                            Upload syllabus, reading lists, or other downloadable
                            materials for students.
                        </Alert>

                        {formData.resources.length > 0 && (
                            <Paper variant="outlined" sx={{ p: 1 }}>
                                <List dense disablePadding>
                                    {formData.resources.map((res) => (
                                        <ListItem
                                            key={res.id}
                                            secondaryAction={
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteResource(res.id)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            }
                                        >
                                            <ListItemIcon sx={{ minWidth: 28 }}>
                                                <DocIcon fontSize="small" color="action" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={res.title || "Resource"}
                                                secondary={res.ext ? `.${res.ext}` : ""}
                                                primaryTypographyProps={{ variant: "body2" }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            hidden
                            onChange={handleResourceUpload}
                        />
                        <Button
                            variant="outlined"
                            startIcon={<UploadIcon />}
                            onClick={() => fileInputRef.current?.click()}
                            sx={{ alignSelf: "flex-start" }}
                        >
                            Upload Resources
                        </Button>

                        {formData.materials.length > 0 && (
                            <Typography variant="body2" color="text.secondary">
                                {formData.materials.length} file
                                {formData.materials.length !== 1 ? "s" : ""} ready
                                to upload — save to complete.
                            </Typography>
                        )}
                    </Stack>
                );

            // --- Settings ---
            case "settings":
                return (
                    <Stack spacing={3}>
                        <Typography variant="h5" fontWeight="bold">
                            Course Details
                        </Typography>
                        <Alert severity="info">
                            Basic course information visible in catalogue listings.
                        </Alert>

                        <TextField
                            label="Course Name"
                            fullWidth
                            required
                            value={formData.name}
                            onChange={(e) => setData("name", e.target.value)}
                            error={!!errors.name}
                            helperText={errors.name}
                        />
                        <TextField
                            label="Course Code"
                            fullWidth
                            value={formData.code}
                            onChange={(e) => setData("code", e.target.value)}
                            error={!!errors.code}
                            helperText={errors.code || "Unique identifier for this course."}
                        />

                        {categories.length > 0 ? (
                            <FormControl fullWidth>
                                <InputLabel id="category-label">Category</InputLabel>
                                <Select
                                    labelId="category-label"
                                    value={formData.category}
                                    label="Category"
                                    onChange={(e) => setData("category", e.target.value)}
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {categories.map((cat) => (
                                        <MenuItem key={cat} value={cat}>
                                            {cat}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        ) : (
                            <TextField
                                label="Category"
                                fullWidth
                                value={formData.category}
                                onChange={(e) => setData("category", e.target.value)}
                            />
                        )}

                        <FormControl fullWidth>
                            <InputLabel id="level-label">Level</InputLabel>
                            <Select
                                labelId="level-label"
                                value={formData.level}
                                label="Level"
                                onChange={(e) => setData("level", e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {courseLevels.map((lvl) => (
                                    <MenuItem key={lvl.value} value={lvl.value}>
                                        {lvl.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Official Level"
                            fullWidth
                            value={formData.officialLevel}
                            onChange={(e) => setData("officialLevel", e.target.value)}
                            placeholder="e.g. Level 5, Certificate I"
                            helperText="Examining body level designation."
                        />

                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                Thumbnail
                            </Typography>
                            {program.thumbnail && (
                                <Box
                                    component="img"
                                    src={program.thumbnail}
                                    alt="Current thumbnail"
                                    sx={{
                                        width: 200,
                                        height: 120,
                                        objectFit: "cover",
                                        borderRadius: 1,
                                        mb: 1,
                                        border: "1px solid",
                                        borderColor: "divider",
                                    }}
                                />
                            )}
                            <Button variant="outlined" component="label" size="small">
                                {program.thumbnail ? "Change Thumbnail" : "Upload Thumbnail"}
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => {
                                        setData("thumbnail", e.target.files?.[0] || null);
                                    }}
                                />
                            </Button>
                        </Box>
                    </Stack>
                );

            // --- Pricing ---
            case "pricing":
                return (
                    <Stack spacing={3}>
                        {!platformFeatures.payments && (
                            <Alert severity="info">
                                Payments are currently disabled for this platform.
                                You can still configure draft pricing here.
                            </Alert>
                        )}
                        <PricingEditor
                            data={formData.custom_pricing}
                            onChange={(val) => setData("custom_pricing", val)}
                        />
                    </Stack>
                );

            // --- FAQ ---
            case "faq":
                return (
                    <FAQEditor
                        data={formData.faq}
                        onChange={(val) => setData("faq", val)}
                    />
                );

            // --- Notice ---
            case "notice":
                return (
                    <NoticeEditor
                        data={formData.notices}
                        onChange={(val) => setData("notices", val)}
                    />
                );

            // --- Drip ---
            case "drip":
                return (
                    <DripEditor
                        program={program}
                        curriculum={curriculum}
                        onSave={(payload, callbacks = {}) => {
                            router.post(
                                `/instructor/programs/${program.id}/manage/settings/`,
                                {
                                    drip_enabled: payload.drip_enabled,
                                    drip_mode: payload.drip_mode,
                                    drip_schedule: payload.drip_schedule,
                                },
                                {
                                    preserveScroll: true,
                                    onFinish: callbacks.onFinish,
                                    onError: callbacks.onError,
                                },
                            );
                        }}
                    />
                );

            // --- Practicum ---
            case "practicum":
                return (
                    <Stack spacing={3}>
                        <Typography variant="h5" fontWeight="bold">
                            Practicum Settings
                        </Typography>
                        <Alert severity="info">
                            Configure requirements for hands-on/practical
                            submissions in this course. Students will upload
                            videos, images, or documents as evidence of
                            competency.
                        </Alert>
                        <Typography variant="body2" color="text.secondary">
                            Practicum rules are configured per-lesson in the
                            Curriculum tab. Enable &ldquo;Requires Upload&rdquo;
                            on individual lessons to require practicum
                            submissions.
                        </Typography>
                        <Button
                            variant="outlined"
                            onClick={() =>
                                router.visit(
                                    `/instructor/programs/${program.id}/manage/`,
                                )
                            }
                        >
                            Go to Curriculum
                        </Button>
                    </Stack>
                );

            // --- Prerequisites ---
            case "prerequisites":
                return (
                    <Stack spacing={3}>
                        <Typography variant="h5" fontWeight="bold">
                            Prerequisites
                        </Typography>
                        <Alert severity="info">
                            Require students to complete other courses before
                            enrolling in this one.
                            {deploymentMode === "tvet" &&
                                " TVET mode: Consider KNQF level sequencing (Level 3 before Level 4)."}
                        </Alert>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.prerequisites_enabled}
                                    onChange={(e) =>
                                        setData(
                                            "prerequisites_enabled",
                                            e.target.checked,
                                        )
                                    }
                                />
                            }
                            label="Require prerequisites for this course"
                        />
                        <FormControl fullWidth>
                            <InputLabel id="prereq-select-label">
                                Prerequisite Programs
                            </InputLabel>
                            <Select
                                labelId="prereq-select-label"
                                multiple
                                value={formData.prerequisite_program_ids}
                                label="Prerequisite Programs"
                                onChange={(e) =>
                                    setData(
                                        "prerequisite_program_ids",
                                        e.target.value,
                                    )
                                }
                                disabled={!formData.prerequisites_enabled}
                            >
                                {availablePrerequisites.map((option) => (
                                    <MenuItem key={option.id} value={option.id}>
                                        {option.name} ({option.code})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                );

            // --- Access ---
            case "access":
                return (
                    <Stack spacing={3}>
                        <Typography variant="h5" fontWeight="bold">
                            Access &amp; Time Limits
                        </Typography>
                        <Alert severity="info">
                            Set how long students have access to this course
                            after enrollment. Leave blank for unlimited access.
                        </Alert>
                        <TextField
                            label="Access duration (days)"
                            type="number"
                            value={formData.access_duration_days || ""}
                            onChange={(e) =>
                                setData(
                                    "access_duration_days",
                                    e.target.value
                                        ? parseInt(e.target.value)
                                        : null,
                                )
                            }
                            placeholder="e.g. 365 for 1 year"
                            helperText="Students will lose access after this many days from enrollment"
                            sx={{ maxWidth: 320 }}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.access_expiration_warning ?? false}
                                    onChange={(e) =>
                                        setData("access_expiration_warning", e.target.checked)
                                    }
                                />
                            }
                            label="Show expiration warning (7 days before)"
                            disabled
                        />
                        <Typography variant="caption" color="text.secondary">
                            Expiration warnings are not yet configurable.
                        </Typography>
                    </Stack>
                );

            default:
                return (
                    <Stack spacing={3}>
                        <Typography variant="h5" fontWeight="bold">
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </Typography>
                        <Alert severity="info">Select a tab above to configure course settings.</Alert>
                    </Stack>
                );
        }
    };

    const isDripTab = activeTab === "drip";
    const isPracticumTab = activeTab === "practicum";

    return (
        <Stack spacing={3}>
            {renderContent()}

            {!isDripTab && !isPracticumTab && (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        pt: 2,
                        borderTop: 1,
                        borderColor: "divider",
                    }}
                >
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={processing}
                        size="large"
                    >
                        Save Changes
                    </Button>
                </Box>
            )}
        </Stack>
    );
}
