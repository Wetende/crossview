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
    ListItemButton,
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
    Settings as MainIcon,
    Upload as UploadIcon,
} from "@mui/icons-material";
import { PricingEditor, FAQEditor, NoticeEditor } from "./SettingsEditors";
import DripEditor from "./DripEditor";
import RichTextEditor from "@/components/RichTextEditor";
import { SETTINGS_SECTIONS } from "../utils/builderTabs";

const SETTINGS_SECTION_ICONS = {
    main: MainIcon,
    access: AccessIcon,
    prerequisites: LinkIcon,
    files: FilesIcon,
    certificate: CertificateIcon,
};

const getUserIsStaff = (user = {}) =>
    Boolean(user.isStaff || user.is_staff || user.isSuperuser || user.is_superuser);

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
        setData((current) => ({
            ...current,
            qualificationFamily: value,
            level: "",
        }));
    };

    const getSubmitPayload = () => {
        if (activeTab === "settings") {
            if (settingsSection === "main") {
                const payload = {
                    tab: "settings",
                    section: "main",
                    name: formData.name,
                    code: formData.code,
                    category: formData.category,
                    level: formData.level,
                    duration_hours: formData.duration_hours,
                    video_hours: formData.video_hours,
                    description: formData.description,
                    whatYouLearn: formData.whatYouLearn,
                    preview_description: formData.preview_description,
                    lock_lessons_in_order: formData.lock_lessons_in_order,
                    co_instructor_ids: JSON.stringify(
                        formData.co_instructor_ids || [],
                    ),
                };
                if (canManageFeatured) {
                    payload.is_featured = formData.is_featured;
                }
                if (hasExamBodies) {
                    payload.examBody = formData.examBody;
                    payload.qualificationFamily = formData.qualificationFamily;
                    payload.awardType = formData.awardType;
                    payload.assessmentMode = formData.assessmentMode;
                }
                if (formData.thumbnail) {
                    payload.thumbnail = formData.thumbnail;
                }
                return payload;
            }
            if (settingsSection === "access") {
                return {
                    tab: "settings",
                    section: "access",
                    access_duration_days: formData.access_duration_days || "",
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

    const handleResourceUpload = (event) => {
        const files = Array.from(event.target.files || []);
        if (files.length > 0) {
            setData("materials", [...formData.materials, ...files]);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
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

    const renderMainSettings = () => (
        <Stack spacing={3}>
            <Typography variant="h5" fontWeight="bold">
                Main
            </Typography>
            <TextField
                label="Course name"
                fullWidth
                required
                value={formData.name}
                onChange={(event) => setData("name", event.target.value)}
                error={Boolean(errors.name)}
                helperText={errors.name}
            />
            <TextField
                label="Course code"
                fullWidth
                required
                value={formData.code}
                onChange={(event) => setData("code", event.target.value)}
                error={Boolean(errors.code)}
                helperText={errors.code || "Unique internal course identifier."}
            />

            {categories.length > 0 ? (
                <FormControl fullWidth>
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                        labelId="category-label"
                        value={formData.category}
                        label="Category"
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
                    label="Category"
                    fullWidth
                    value={formData.category}
                    onChange={(event) =>
                        setData("category", event.target.value)
                    }
                />
            )}

            <TextField
                label="Level"
                fullWidth
                value={formData.level}
                onChange={(event) => setData("level", event.target.value)}
                placeholder="e.g. Beginner, Intermediate, Advanced"
            />

            {hasExamBodies && (
                <>
                    <FormControl fullWidth>
                        <InputLabel id="exam-body-label">
                            Examining body
                        </InputLabel>
                        <Select
                            labelId="exam-body-label"
                            value={formData.examBody}
                            label="Examining body"
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

                    {formData.examBody && (
                        <FormControl fullWidth>
                            <InputLabel id="qualification-family-label">
                                Qualification family
                            </InputLabel>
                            <Select
                                labelId="qualification-family-label"
                                value={formData.qualificationFamily}
                                label="Qualification family"
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
                    )}

                    {formData.qualificationFamily &&
                        registryLevels.length > 0 && (
                            <FormControl fullWidth>
                                <InputLabel id="registry-level-label">
                                    Registered level
                                </InputLabel>
                                <Select
                                    labelId="registry-level-label"
                                    value={formData.level}
                                    label="Registered level"
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
                        )}

                    <TextField
                        label="Award type"
                        fullWidth
                        value={formData.awardType}
                        onChange={(event) =>
                            setData("awardType", event.target.value)
                        }
                    />
                    <TextField
                        label="Assessment mode"
                        fullWidth
                        value={formData.assessmentMode}
                        onChange={(event) =>
                            setData("assessmentMode", event.target.value)
                        }
                    />
                </>
            )}

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                    label="Course duration"
                    type="number"
                    fullWidth
                    value={formData.duration_hours}
                    onChange={(event) =>
                        setData("duration_hours", event.target.value)
                    }
                    inputProps={{ min: 0 }}
                    helperText="Total course duration in hours."
                />
                <TextField
                    label="Video duration"
                    type="number"
                    fullWidth
                    value={formData.video_hours}
                    onChange={(event) =>
                        setData("video_hours", event.target.value)
                    }
                    inputProps={{ min: 0 }}
                    helperText="Video content duration in hours."
                />
            </Stack>

            <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    Owner
                </Typography>
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

            <FormControl fullWidth>
                <InputLabel id="co-instructors-label">
                    Co-instructors
                </InputLabel>
                <Select
                    labelId="co-instructors-label"
                    multiple
                    value={formData.co_instructor_ids}
                    label="Co-instructors"
                    onChange={(event) =>
                        setData("co_instructor_ids", event.target.value)
                    }
                    renderValue={(selected) => (
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
                    )}
                >
                    {availableCoInstructors.map((instructor) => (
                        <MenuItem key={instructor.id} value={instructor.id}>
                            {instructor.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    Image
                </Typography>
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

            <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    Description
                </Typography>
                <RichTextEditor
                    value={formData.description}
                    onChange={(value) => setData("description", value)}
                    minHeight={220}
                    placeholder="Introduce your course, who it is for, and what students can expect."
                />
            </Box>

            <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    What You&apos;ll Learn
                </Typography>
                <RichTextEditor
                    value={formData.whatYouLearn}
                    onChange={(value) => setData("whatYouLearn", value)}
                    minHeight={180}
                    placeholder="List the outcomes students should be able to achieve."
                />
            </Box>

            <TextField
                label="Course preview description"
                fullWidth
                multiline
                minRows={3}
                value={formData.preview_description}
                onChange={(event) =>
                    setData("preview_description", event.target.value)
                }
                helperText="Short summary used on cards and course previews."
            />

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
        </Stack>
    );

    const renderAccessSettings = () => (
        <Stack spacing={3}>
            <Typography variant="h5" fontWeight="bold">
                Access
            </Typography>
            <Alert severity="info">
                Set how long students keep access after enrollment. Leave blank
                for unlimited access.
            </Alert>
            <TextField
                label="Access duration (days)"
                type="number"
                value={formData.access_duration_days || ""}
                onChange={(event) =>
                    setData(
                        "access_duration_days",
                        event.target.value ? parseInt(event.target.value, 10) : "",
                    )
                }
                inputProps={{ min: 1 }}
                sx={{ maxWidth: 360 }}
            />
        </Stack>
    );

    const renderPrerequisiteSettings = () => (
        <Stack spacing={3}>
            <Typography variant="h5" fontWeight="bold">
                Prerequisites
            </Typography>
            <Alert severity="info">
                Require students to complete selected courses before enrolling in
                this course.
            </Alert>
            <TextField
                label="Prerequisite passing percent (%)"
                type="number"
                fullWidth
                value={formData.prerequisite_passing_percent}
                onChange={(event) =>
                    setData("prerequisite_passing_percent", event.target.value)
                }
                inputProps={{ min: 0, max: 100 }}
                helperText="Use 0 when completion alone is enough."
            />
            <FormControl fullWidth>
                <InputLabel id="prereq-select-label">Courses</InputLabel>
                <Select
                    labelId="prereq-select-label"
                    multiple
                    value={formData.prerequisite_program_ids}
                    label="Courses"
                    onChange={(event) =>
                        setData("prerequisite_program_ids", event.target.value)
                    }
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

    const renderCourseFilesSettings = () => (
        <Stack spacing={3}>
            <Typography variant="h5" fontWeight="bold">
                Course files
            </Typography>
            <Alert severity="info">
                Upload syllabus, reading lists, or other downloadable materials
                for students. Lesson-specific files stay inside lesson editors.
            </Alert>
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
                                    secondary={resource.ext ? `.${resource.ext}` : ""}
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
            >
                Upload resources
            </Button>
            {formData.materials.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                    {formData.materials.length} file
                    {formData.materials.length === 1 ? "" : "s"} ready to upload.
                </Typography>
            )}
        </Stack>
    );

    const renderCertificateSettings = () => (
        <Stack spacing={3}>
            <Typography variant="h5" fontWeight="bold">
                Certificate
            </Typography>
            <Alert severity={program.certificateEnabled ? "success" : "info"}>
                {program.certificateLabel}
            </Alert>
            <Typography variant="body2" color="text.secondary">
                Certificate behavior is controlled by the academic blueprint in
                Django admin, so course authors cannot override it here.
            </Typography>
        </Stack>
    );

    const renderSettings = () => {
        const sectionRenderers = {
            main: renderMainSettings,
            access: renderAccessSettings,
            prerequisites: renderPrerequisiteSettings,
            files: renderCourseFilesSettings,
            certificate: renderCertificateSettings,
        };
        const renderSection =
            sectionRenderers[settingsSection] || renderMainSettings;

        return (
            <Box sx={{ display: "flex", minHeight: 520 }}>
                <Box
                    sx={{
                        width: 240,
                        pr: 3,
                        borderRight: 1,
                        borderColor: "divider",
                    }}
                >
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        Settings
                    </Typography>
                    <List disablePadding>
                        {SETTINGS_SECTIONS.map((section) => {
                            const Icon = SETTINGS_SECTION_ICONS[section.value];
                            const selected = settingsSection === section.value;
                            return (
                                <ListItemButton
                                    key={section.value}
                                    selected={selected}
                                    onClick={() =>
                                        onSettingsSectionChange?.(section.value)
                                    }
                                    sx={{ borderRadius: 1, mb: 0.5 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 34 }}>
                                        <Icon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary={section.label} />
                                </ListItemButton>
                            );
                        })}
                    </List>
                </Box>
                <Box sx={{ flex: 1, pl: 3, minWidth: 0 }}>
                    {renderSection()}
                </Box>
            </Box>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case "settings":
                return renderSettings();
            case "pricing":
                return (
                    <Stack spacing={3}>
                        {!platformFeatures.payments && (
                            <Alert severity="info">
                                Payments are currently disabled for this
                                platform. You can still configure draft pricing.
                            </Alert>
                        )}
                        <PricingEditor
                            data={formData.custom_pricing}
                            onChange={(value) => setData("custom_pricing", value)}
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

    const hideSaveButton =
        activeTab === "drip" ||
        activeTab === "practicum" ||
        (activeTab === "settings" && settingsSection === "certificate");

    return (
        <Stack spacing={3}>
            {renderContent()}
            {!hideSaveButton && (
                <>
                    <Divider />
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={processing}
                            size="large"
                        >
                            Save changes
                        </Button>
                    </Box>
                </>
            )}
        </Stack>
    );
}
