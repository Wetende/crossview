import { useEffect, useMemo, useRef } from "react";
import { useForm, router, usePage } from "@inertiajs/react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    Divider,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Paper,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import {
    CardMembership as CertificateIcon,
    Delete as DeleteIcon,
    Description as DocIcon,
    FolderOutlined as FilesIcon,
    Link as LinkIcon,
    LockOutlined as AccessIcon,
    SchoolOutlined as AcademicIcon,
    Settings as MainIcon,
} from "@mui/icons-material";
import { PricingEditor, FAQEditor, NoticeEditor } from "./SettingsEditors";
import DripEditor from "./DripEditor";
import RichTextEditor from "@/components/RichTextEditor";
import SidebarLayout from "./SidebarLayout";
import { SETTINGS_SECTIONS } from "../utils/builderTabs";

const SETTINGS_SECTION_ICONS = {
    main: MainIcon,
    academic: AcademicIcon,
    access: AccessIcon,
    prerequisites: LinkIcon,
    files: FilesIcon,
    certificate: CertificateIcon,
};

const getUserIsStaff = (user = {}) =>
    Boolean(
        user.isStaff || user.is_staff || user.isSuperuser || user.is_superuser,
    );

export default function SettingsPanel({
    program,
    activeTab,
    settingsSection = "main",
    onSettingsSectionChange,
    curriculum,
    platformFeatures = {},
    deploymentMode = "custom",
}) {
    const { props } = usePage();
    const authUser = props.auth?.user || {};
    const canManageFeatured = getUserIsStaff(authUser);
    const availablePrerequisites = props.availablePrerequisites || [];
    const availableCoInstructors = props.availableCoInstructors || [];
    const categories = props.platform?.programCategories || [];
    const examBodyRegistry = useMemo(
        () => props.examBodyRegistry || {},
        [props.examBodyRegistry],
    );
    const isTvetMode = deploymentMode === "tvet";
    const hasExamBodies =
        isTvetMode && Object.keys(examBodyRegistry).length > 0;
    const fileInputRef = useRef(null);

    const {
        data: formData,
        setData,
        transform,
        post,
        processing,
        errors,
    } = useForm({
        name: program.name || "",
        code: program.code || "",
        category: program.category || "",
        level: program.level || "",
        examBody: program.examBody || "",
        qualificationFamily: program.qualificationFamily || "",
        awardType: program.awardType || "",
        assessmentMode: program.assessmentMode || "",
        thumbnail: null,
        duration_hours: program.durationHours ?? 0,
        video_hours: program.videoHours ?? 0,
        description: program.description || "",
        whatYouLearn: program.whatYouLearnHtml || "",
        preview_description: program.previewDescription || "",
        is_featured: Boolean(program.isFeatured),
        lock_lessons_in_order: program.lockLessonsInOrder !== false,
        co_instructor_ids: (program.coInstructors || []).map(
            (instructor) => instructor.id,
        ),
        resources: program.resources || [],
        deleteResourceIds: [],
        materials: [],
        access_duration_days: program.accessDurationDays || "",
        access_time_limit_enabled: Boolean(program.accessDurationDays),
        prerequisite_passing_percent: program.prerequisitePassingPercent ?? 50,
        prerequisite_program_ids: program.prerequisiteProgramIds || [],
        custom_pricing: program.customPricing || {},
        faq: program.faq || [],
        notices: program.notices || [],
        drip_enabled: program.dripEnabled || false,
        drip_mode: program.dripMode || "none",
    });

    const examBodies = useMemo(
        () => Object.keys(examBodyRegistry),
        [examBodyRegistry],
    );
    const selectedBodyData = useMemo(
        () => examBodyRegistry[formData.examBody] || null,
        [examBodyRegistry, formData.examBody],
    );
    const qualificationFamilies = useMemo(
        () =>
            selectedBodyData
                ? Object.keys(selectedBodyData.families || {})
                : [],
        [selectedBodyData],
    );
    const selectedFamilyData = useMemo(
        () =>
            selectedBodyData?.families?.[formData.qualificationFamily] || null,
        [selectedBodyData, formData.qualificationFamily],
    );
    const registryLevels = useMemo(
        () => selectedFamilyData?.levels || [],
        [selectedFamilyData],
    );

    useEffect(() => {
        if (!selectedFamilyData) {
            return;
        }
        setData((current) => ({
            ...current,
            awardType: selectedFamilyData.awardType || current.awardType,
            assessmentMode:
                selectedFamilyData.assessmentMode || current.assessmentMode,
        }));
    }, [selectedFamilyData, setData]);

    const handleExamBodyChange = (value) => {
        setData((current) => ({
            ...current,
            examBody: value,
            qualificationFamily: "",
            level: "",
            awardType: "",
            assessmentMode: "",
        }));
    };

    const handleQualificationFamilyChange = (value) => {
        const nextFamilyData = selectedBodyData?.families?.[value] || null;
        setData((current) => ({
            ...current,
            qualificationFamily: value,
            level: "",
            awardType: nextFamilyData?.awardType || "",
            assessmentMode: nextFamilyData?.assessmentMode || "",
        }));
    };

    const getSubmitPayload = () => {
        if (activeTab === "settings") {
            if (settingsSection === "main") {
                const payload = {
                    tab: "settings",
                    section: "main",
                    name: formData.name,
                    category: formData.category,
                    duration_hours: formData.duration_hours,
                    video_hours: formData.video_hours,
                    description: formData.description,
                    whatYouLearn: formData.whatYouLearn,
                    preview_description: formData.preview_description,
                    lock_lessons_in_order: formData.lock_lessons_in_order,
                };
                if (!hasExamBodies) {
                    payload.level = formData.level;
                }
                if (canManageFeatured) {
                    payload.is_featured = formData.is_featured;
                }
                if (formData.thumbnail) {
                    payload.thumbnail = formData.thumbnail;
                }
                return payload;
            }
            if (settingsSection === "academic") {
                const payload = {
                    tab: "settings",
                    section: "academic",
                    code: formData.code,
                    co_instructor_ids: JSON.stringify(
                        formData.co_instructor_ids || [],
                    ),
                };
                if (hasExamBodies) {
                    payload.examBody = formData.examBody;
                    payload.qualificationFamily = formData.qualificationFamily;
                    payload.level = formData.level;
                }
                return payload;
            }
            if (settingsSection === "access") {
                return {
                    tab: "settings",
                    section: "access",
                    access_duration_days: formData.access_time_limit_enabled
                        ? formData.access_duration_days || ""
                        : "",
                };
            }
            if (settingsSection === "prerequisites") {
                return {
                    tab: "settings",
                    section: "prerequisites",
                    prerequisite_passing_percent:
                        formData.prerequisite_passing_percent,
                    prerequisite_program_ids: JSON.stringify(
                        formData.prerequisite_program_ids || [],
                    ),
                };
            }
            if (settingsSection === "files") {
                return {
                    tab: "settings",
                    section: "files",
                    deleteResourceIds: JSON.stringify(
                        formData.deleteResourceIds || [],
                    ),
                    materials: formData.materials,
                };
            }
            return { tab: "settings", section: settingsSection };
        }

        switch (activeTab) {
            case "pricing":
                return {
                    tab: activeTab,
                    custom_pricing: JSON.stringify(
                        formData.custom_pricing || {},
                    ),
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
                setData((current) => ({
                    ...current,
                    deleteResourceIds:
                        settingsSection === "files"
                            ? []
                            : current.deleteResourceIds,
                    materials:
                        settingsSection === "files" ? [] : current.materials,
                    thumbnail:
                        settingsSection === "main" ? null : current.thumbnail,
                }));
            },
        });
    };

    const addResourceFiles = (fileList) => {
        const files = Array.from(fileList || []);
        if (files.length > 0) {
            setData((current) => ({
                ...current,
                materials: [...(current.materials || []), ...files],
            }));
        }
    };

    const handleResourceUpload = (event) => {
        addResourceFiles(event.target.files);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleResourceDragOver = (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
    };

    const handleResourceDrop = (event) => {
        event.preventDefault();
        addResourceFiles(event.dataTransfer.files);
    };

    const handleAccessTimeLimitChange = (event) => {
        const enabled = event.target.checked;
        setData((current) => ({
            ...current,
            access_time_limit_enabled: enabled,
            access_duration_days: enabled ? current.access_duration_days : "",
        }));
    };

    const handleDeleteResource = (resourceId) => {
        setData(
            "resources",
            formData.resources.filter((resource) => resource.id !== resourceId),
        );
        setData("deleteResourceIds", [
            ...formData.deleteResourceIds,
            resourceId,
        ]);
    };

    const renderSectionPanel = (title, children, contentSx = {}) => (
        <>
            <Box
                sx={{
                    px: { xs: 2.5, md: 3 },
                    py: { xs: 2.25, md: 2.75 },
                    borderBottom: 1,
                    borderColor: "divider",
                }}
            >
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 500,
                        letterSpacing: 0,
                        fontSize: { xs: 26, md: 34 },
                        lineHeight: 1.1,
                    }}
                >
                    {title}
                </Typography>
            </Box>
            <Box
                sx={{
                    p: { xs: 2.5, md: 3 },
                    pt: { xs: 2.5, md: 4 },
                    ...contentSx,
                }}
            >
                {children}
            </Box>
        </>
    );

    const renderFieldLabel = (label, required = false) => (
        <InputLabel
            shrink
            sx={{ mb: 1, fontWeight: 500, color: "text.primary", display: 'block' }}
        >
            {label}
            {required && (
                <Box component="span" sx={{ color: "error.main" }}>
                    {" *"}
                </Box>
            )}
        </InputLabel>
    );

    const renderOwner = () => (
        <Box>
            {renderFieldLabel("Owner")}
            {program.owner ? (
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar>{program.owner.name?.charAt(0) || "I"}</Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight={600}>
                            {program.owner.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {program.owner.email}
                        </Typography>
                    </Box>
                </Stack>
            ) : (
                <Alert severity="warning">No owner is assigned.</Alert>
            )}
        </Box>
    );

    const renderCoInstructors = () => (
        <Box>
            {renderFieldLabel("Co-instructors")}
            <FormControl fullWidth>
                <Select
                    multiple
                    value={formData.co_instructor_ids}
                    displayEmpty
                    onChange={(event) =>
                        setData("co_instructor_ids", event.target.value)
                    }
                    renderValue={(selected) => {
                        if (selected.length === 0) {
                            return (
                                <Typography color="text.secondary">
                                    Choose instructor
                                </Typography>
                            );
                        }
                        return (
                            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                {selected.map((id) => {
                                    const instructor = availableCoInstructors.find(
                                        (option) => option.id === id,
                                    );
                                    return (
                                        <Chip
                                            key={id}
                                            label={instructor?.name || id}
                                            size="small"
                                        />
                                    );
                                })}
                            </Box>
                        );
                    }}
                >
                    {availableCoInstructors.map((instructor) => (
                        <MenuItem key={instructor.id} value={instructor.id}>
                            {instructor.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );

    const renderReadOnlyField = (label, value) => (
        <Box sx={{ flex: 1 }}>
            {renderFieldLabel(label)}
            <TextField
                fullWidth
                value={value || "Not set"}
                InputProps={{ readOnly: true }}
                sx={{
                    "& .MuiInputBase-input": {
                        color: value ? "text.primary" : "text.secondary",
                    },
                }}
            />
        </Box>
    );

    const renderMainSettings = () =>
        renderSectionPanel(
            "Main",
            <Stack spacing={3}>
                <Box>
                    {renderFieldLabel("Course name", true)}
                    <TextField
                        fullWidth
                        required
                        value={formData.name}
                        onChange={(event) => setData("name", event.target.value)}
                        error={Boolean(errors.name)}
                        helperText={errors.name}
                    />
                </Box>

                <Box>
                    {renderFieldLabel("Category")}
                    {categories.length > 0 ? (
                        <FormControl fullWidth>
                            <Select
                                value={formData.category}
                                displayEmpty
                                onChange={(event) =>
                                    setData("category", event.target.value)
                                }
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {categories.map((category) => (
                                    <MenuItem key={category} value={category}>
                                        {category}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    ) : (
                        <TextField
                            fullWidth
                            value={formData.category}
                            onChange={(event) =>
                                setData("category", event.target.value)
                            }
                        />
                    )}
                </Box>

                {!hasExamBodies && (
                    <Box>
                        {renderFieldLabel("Level")}
                        <TextField
                            fullWidth
                            value={formData.level}
                            onChange={(event) =>
                                setData("level", event.target.value)
                            }
                            placeholder="e.g. Beginner, Intermediate, Advanced"
                        />
                    </Box>
                )}

                <Box>
                    {renderFieldLabel("Image")}
                    {program.thumbnail && (
                        <Box
                            component="img"
                            src={program.thumbnail}
                            alt="Current course thumbnail"
                            sx={{
                                width: "100%",
                                maxHeight: 260,
                                objectFit: "cover",
                                borderRadius: 1,
                                mb: 1,
                                border: "1px solid",
                                borderColor: "divider",
                            }}
                        />
                    )}
                    <Button variant="outlined" component="label" size="small">
                        {program.thumbnail ? "Change image" : "Upload image"}
                        <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(event) =>
                                setData("thumbnail", event.target.files?.[0] || null)
                            }
                        />
                    </Button>
                </Box>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <Box sx={{ flex: 1 }}>
                        {renderFieldLabel("Course duration")}
                        <TextField
                            type="number"
                            fullWidth
                            value={formData.duration_hours}
                            onChange={(event) =>
                                setData("duration_hours", event.target.value)
                            }
                            inputProps={{ min: 0 }}
                            helperText="Total course duration in hours."
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        {renderFieldLabel("Video duration")}
                        <TextField
                            type="number"
                            fullWidth
                            value={formData.video_hours}
                            onChange={(event) =>
                                setData("video_hours", event.target.value)
                            }
                            inputProps={{ min: 0 }}
                            helperText="Video content duration in hours."
                        />
                    </Box>
                </Stack>

                <Box>
                    {renderFieldLabel("Description")}
                    <RichTextEditor
                        value={formData.description}
                        onChange={(value) => setData("description", value)}
                        minHeight={220}
                        placeholder="Introduce your course, who it is for, and what students can expect."
                    />
                </Box>

                <Box>
                    {renderFieldLabel("What You'll Learn")}
                    <RichTextEditor
                        value={formData.whatYouLearn}
                        onChange={(value) => setData("whatYouLearn", value)}
                        minHeight={180}
                        placeholder="List the outcomes students should be able to achieve."
                    />
                </Box>

                <Box>
                    {renderFieldLabel("Course preview description")}
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        value={formData.preview_description}
                        onChange={(event) =>
                            setData("preview_description", event.target.value)
                        }
                        helperText="Short summary used on cards and course previews."
                    />
                </Box>

                {canManageFeatured && (
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.is_featured}
                                onChange={(event) =>
                                    setData("is_featured", event.target.checked)
                                }
                            />
                        }
                        label="Featured course"
                    />
                )}
                <FormControlLabel
                    control={
                        <Switch
                            checked={formData.lock_lessons_in_order}
                            onChange={(event) =>
                                setData(
                                    "lock_lessons_in_order",
                                    event.target.checked,
                                )
                            }
                        />
                    }
                    label="Lock lessons in order"
                />
            </Stack>,
        );

    const renderAcademicSettings = () =>
        renderSectionPanel(
            "Academic Details",
            <Stack spacing={3}>
                <Box>
                    {renderFieldLabel("Course code", true)}
                    <TextField
                        fullWidth
                        required
                        value={formData.code}
                        onChange={(event) => setData("code", event.target.value)}
                        error={Boolean(errors.code)}
                        helperText={errors.code || "Unique internal course identifier."}
                    />
                </Box>

                {hasExamBodies && (
                    <>
                        <Box>
                            {renderFieldLabel("Examining body")}
                            <FormControl fullWidth>
                                <Select
                                    value={formData.examBody}
                                    displayEmpty
                                    onChange={(event) =>
                                        handleExamBodyChange(event.target.value)
                                    }
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {examBodies.map((body) => (
                                        <MenuItem key={body} value={body}>
                                            {examBodyRegistry[body].label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {formData.examBody && (
                            <Box>
                                {renderFieldLabel("Qualification family")}
                                <FormControl fullWidth>
                                    <Select
                                        value={formData.qualificationFamily}
                                        displayEmpty
                                        onChange={(event) =>
                                            handleQualificationFamilyChange(
                                                event.target.value,
                                            )
                                        }
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
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

                        {formData.qualificationFamily &&
                            registryLevels.length > 0 && (
                                <Box>
                                    {renderFieldLabel("Registered level")}
                                    <FormControl fullWidth>
                                        <Select
                                            value={formData.level}
                                            displayEmpty
                                            onChange={(event) =>
                                                setData("level", event.target.value)
                                            }
                                        >
                                            <MenuItem value="">
                                                <em>None</em>
                                            </MenuItem>
                                            {registryLevels.map((level) => (
                                                <MenuItem key={level} value={level}>
                                                    {level}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            )}

                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            {renderReadOnlyField("Award type", formData.awardType)}
                            {renderReadOnlyField(
                                "Assessment mode",
                                formData.assessmentMode,
                            )}
                        </Stack>
                    </>
                )}

                <Divider />

                <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                    <Box sx={{ flex: 1 }}>{renderOwner()}</Box>
                    <Box sx={{ flex: 1 }}>{renderCoInstructors()}</Box>
                </Stack>
            </Stack>,
        );

    const renderAccessSettings = () =>
        renderSectionPanel(
            "Access",
            <Box>
                <Box
                    sx={{
                        px: { xs: 2.5, md: 3 },
                        py: { xs: 2, md: 2.25 },
                    }}
                >
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.access_time_limit_enabled}
                                onChange={handleAccessTimeLimitChange}
                            />
                        }
                        label="Time limit"
                        sx={{
                            m: 0,
                            "& .MuiFormControlLabel-label": {
                                fontWeight: 600,
                            },
                        }}
                    />
                    {formData.access_time_limit_enabled && (
                        <Box
                            sx={{
                                maxWidth: 360,
                                mt: 2,
                                pl: { xs: 0, md: 5 },
                            }}
                        >
                            {renderFieldLabel("Access duration (days)")}
                            <TextField
                                type="number"
                                fullWidth
                                value={formData.access_duration_days || ""}
                                onChange={(event) =>
                                    setData(
                                        "access_duration_days",
                                        event.target.value
                                            ? parseInt(event.target.value, 10)
                                            : "",
                                    )
                                }
                                inputProps={{ min: 1 }}
                                error={!formData.access_duration_days}
                                helperText={
                                    !formData.access_duration_days
                                        ? "Enter days to save a time limit."
                                        : "Students keep access for this many days after enrollment."
                                }
                            />
                        </Box>
                    )}
                </Box>
            </Box>,
            { p: 0, pt: 0 },
        );

    const renderPrerequisiteSettings = () =>
        renderSectionPanel(
            "Prerequisites",
            <Stack spacing={3}>
                <Alert severity="info">
                    Require students to complete selected courses before enrolling in
                    this course.
                </Alert>
                <Box>
                    {renderFieldLabel("Prerequisite passing percent (%)")}
                    <TextField
                        type="number"
                        fullWidth
                        value={formData.prerequisite_passing_percent}
                        onChange={(event) =>
                            setData("prerequisite_passing_percent", event.target.value)
                        }
                        inputProps={{ min: 0, max: 100 }}
                        helperText="Use 0 when completion alone is enough."
                    />
                </Box>
                <Box>
                    {renderFieldLabel("Courses")}
                    <FormControl fullWidth>
                        <Select
                            multiple
                            value={formData.prerequisite_program_ids}
                            displayEmpty
                            onChange={(event) =>
                                setData(
                                    "prerequisite_program_ids",
                                    event.target.value,
                                )
                            }
                            renderValue={(selected) => {
                                if (selected.length === 0) {
                                    return (
                                        <Typography color="text.secondary">
                                            Select prerequisite courses
                                        </Typography>
                                    );
                                }
                                return selected
                                    .map((id) => {
                                        const option = availablePrerequisites.find(
                                            (item) => item.id === id,
                                        );
                                        return option?.name || id;
                                    })
                                    .join(", ");
                            }}
                        >
                            {availablePrerequisites.map((option) => (
                                <MenuItem key={option.id} value={option.id}>
                                    {option.name} ({option.code})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Stack>,
        );

    const renderCourseFilesSettings = () =>
        renderSectionPanel(
            "Course files",
            <Stack spacing={3}>
                <Box>
                    {renderFieldLabel("Course files")}
                    <Box
                        onDragOver={handleResourceDragOver}
                        onDrop={handleResourceDrop}
                        sx={{
                            minHeight: { xs: 220, md: 266 },
                            border: 1,
                            borderStyle: "dashed",
                            borderColor: "divider",
                            bgcolor: "#f4f7fb",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 2,
                            px: { xs: 2, md: 4 },
                            textAlign: "center",
                            transition:
                                "background-color 0.2s ease, border-color 0.2s ease",
                            "&:hover": {
                                bgcolor: "#edf3fb",
                                borderColor: "primary.light",
                            },
                        }}
                    >
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ maxWidth: 500, lineHeight: 1.5 }}
                        >
                            Upload syllabus, reading lists, or other downloadable
                            materials for students. Lesson-specific files stay inside
                            lesson editors.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => fileInputRef.current?.click()}
                            sx={{ textTransform: "none", px: 3 }}
                        >
                            Browse files
                        </Button>
                    </Box>
                </Box>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    onChange={handleResourceUpload}
                />
                {formData.materials.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                        {formData.materials.length} file
                        {formData.materials.length === 1 ? "" : "s"} ready to upload.
                    </Typography>
                )}
                {formData.resources.length > 0 && (
                    <Paper variant="outlined" sx={{ p: 1 }}>
                        <List dense disablePadding>
                            {formData.resources.map((resource) => (
                                <ListItem
                                    key={resource.id}
                                    secondaryAction={
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() =>
                                                handleDeleteResource(resource.id)
                                            }
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    }
                                >
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                        <DocIcon fontSize="small" color="action" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={resource.title || "Resource"}
                                        secondary={
                                            resource.ext ? `.${resource.ext}` : ""
                                        }
                                        primaryTypographyProps={{ variant: "body2" }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                )}
            </Stack>,
        );

    const renderCertificateSettings = () =>
        renderSectionPanel(
            "Certificate",
            <Stack spacing={3}>
                <Alert severity={program.certificateEnabled ? "success" : "info"}>
                    {program.certificateLabel}
                </Alert>
                <Typography variant="body2" color="text.secondary">
                    Certificate behavior is controlled by the academic blueprint in
                    Django admin, so course authors cannot override it here.
                </Typography>
            </Stack>,
        );

    const isAccessTimeLimitIncomplete =
        activeTab === "settings" &&
        settingsSection === "access" &&
        formData.access_time_limit_enabled &&
        !formData.access_duration_days;

    const renderSaveAction = () => (
        <>
            <Divider />
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    p: { xs: 2.5, md: 3 },
                }}
            >
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={processing || isAccessTimeLimitIncomplete}
                    size="large"
                >
                    Save changes
                </Button>
            </Box>
        </>
    );

    const hideSaveButton =
        activeTab === "drip" ||
        activeTab === "practicum" ||
        (activeTab === "settings" && settingsSection === "certificate");

    const renderSettings = () => {
        const sectionRenderers = {
            main: renderMainSettings,
            academic: renderAcademicSettings,
            access: renderAccessSettings,
            prerequisites: renderPrerequisiteSettings,
            files: renderCourseFilesSettings,
            certificate: renderCertificateSettings,
        };
        const renderSection =
            sectionRenderers[settingsSection] || renderMainSettings;

        const menuItems = SETTINGS_SECTIONS.map((section) => ({
            ...section,
            icon: SETTINGS_SECTION_ICONS[section.value],
        }));

        return (
            <SidebarLayout
                sidebarTitle="Settings"
                menuItems={menuItems}
                activeSection={settingsSection}
                onSectionChange={onSettingsSectionChange}
            >
                {renderSection()}
                {!hideSaveButton && renderSaveAction()}
            </SidebarLayout>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case "settings":
                return renderSettings();
            case "pricing":
                return (
                    <Stack spacing={3}>
                        <PricingEditor
                            data={formData.custom_pricing}
                            onChange={(value) => setData("custom_pricing", value)}
                            recommendation={program.pricingRecommendation || {}}
                            recommendations={program.pricingRecommendations || {}}
                            platformFeatures={platformFeatures}
                            deploymentMode={deploymentMode}
                            examBody={formData.examBody || program.examBody}
                            qualificationFamily={
                                formData.qualificationFamily ||
                                program.qualificationFamily
                            }
                        />
                    </Stack>
                );
            case "faq":
                return (
                    <FAQEditor
                        data={formData.faq}
                        onChange={(value) => setData("faq", value)}
                    />
                );
            case "notice":
                return (
                    <NoticeEditor
                        data={formData.notices}
                        onChange={(value) => setData("notices", value)}
                    />
                );
            case "drip":
                return (
                    <DripEditor
                        program={program}
                        curriculum={curriculum}
                        onSave={(payload, callbacks = {}) => {
                            router.post(
                                `/instructor/programs/${program.id}/manage/settings/`,
                                {
                                    tab: "drip",
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
            case "practicum":
                return (
                    <Stack spacing={3}>
                        <Typography variant="h5" fontWeight="bold">
                            Practicum Settings
                        </Typography>
                        <Alert severity="info">
                            Practicum rules are configured per lesson in the
                            Curriculum tab.
                        </Alert>
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
            default:
                return null;
        }
    };

    if (activeTab === "settings") {
        return renderSettings();
    }

    return (
        <Stack spacing={3}>
            {renderContent()}
            {!hideSaveButton && renderSaveAction()}
        </Stack>
    );
}
