import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState,
} from "react";
import { router } from "@inertiajs/react";
import {
    Box,
    Typography,
    Button,
    TextField,
    Tabs,
    Tab,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Tooltip,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Chip,
    Snackbar,
    Alert,
    FormHelperText,
} from "@mui/material";
import RichTextEditor from "@/components/RichTextEditor";
import FileUploader from "@/components/FileUploader";
import GamificationSettings from "../components/GamificationSettings";
import DocumentPrimaryUploader from "../components/DocumentPrimaryUploader";
import AutosaveStatus from "../components/AutosaveStatus";
import ScheduledSessionFields from "../components/ScheduledSessionFields";
import useAutosave from "../hooks/useAutosave";
import {
    Article as ArticleIcon,
    OndemandVideo as VideoIcon,
    VideoCameraFront as ZoomIcon,
    Assignment as AssignmentIcon,
    PictureAsPdf as DocumentIcon,
    InfoOutlined as InfoIcon,
    Add as AddIcon,
    PushPin as PinIcon,
    Lock as LockIcon,
    LockOpen as LockOpenIcon,
    ChatBubbleOutline as ChatIcon,
} from "@mui/icons-material";

const SCHEDULED_LESSON_TYPES = [
    "live_class",
    "live_meeting",
    "live_stream",
    "in_person_session",
];

const inferSessionKind = (properties = {}) => {
    const configured = (properties.session_kind || properties.lesson_type || "").toLowerCase();
    if (configured && configured !== "live_class") return configured;
    const url = (properties.session_url || properties.video_url || "").toLowerCase();
    return url.includes("youtube") || url.includes("youtu.be") || url.includes("vimeo")
        ? "live_stream"
        : "live_meeting";
};

const inferSessionProvider = (properties = {}, sessionKind) => {
    if (sessionKind === "in_person_session") return "physical";
    if (properties.provider || properties.session_provider) {
        return properties.provider || properties.session_provider;
    }
    const url = (properties.session_url || properties.video_url || "").toLowerCase();
    if (url.includes("meet.google")) return "google_meet";
    if (url.includes("zoom.")) return "zoom";
    if (url.includes("teams.microsoft")) return "teams";
    if (url.includes("youtube") || url.includes("youtu.be")) return "youtube";
    if (url.includes("vimeo")) return "vimeo";
    return "custom";
};

const deriveSessionDuration = (startDate, startTime, endDate, endTime) => {
    if (!startDate || !startTime || !endDate || !endTime) return "";
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
    if (!Number.isFinite(minutes) || minutes <= 0) return "";
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return [hours ? `${hours}h` : "", remainingMinutes ? `${remainingMinutes}m` : ""]
        .filter(Boolean)
        .join(" ");
};

const ContentEditor = forwardRef(function ContentEditor(
    { node, onSave, blueprint },
    ref,
) {
    const TITLE_MIN_LENGTH = 5;
    const TITLE_MAX_LENGTH = 100;

    // Get feature flags from blueprint
    const featureFlags = blueprint?.featureFlags || {};
    const [title, setTitle] = useState(node.title);
    const [activeTab, setActiveTab] = useState("lesson");
    const [description, setDescription] = useState(node.description || "");
    const [content, setContent] = useState(node.properties?.content || "");
    const [duration, setDuration] = useState(node.properties?.duration || "");
    const [isPreview, setIsPreview] = useState(
        node.properties?.is_preview || false,
    );
    const [startDate, setStartDate] = useState(
        node.properties?.start_date || "",
    );
    const [startTime, setStartTime] = useState(
        node.properties?.start_time || "",
    );
    const [endDate, setEndDate] = useState(node.properties?.end_date || "");
    const [endTime, setEndTime] = useState(node.properties?.end_time || "");
    const [files, setFiles] = useState(node.properties?.files || []);
    const [documentData, setDocumentData] = useState(
        node.properties?.document || null,
    );
    const [strictCompletion, setStrictCompletion] = useState(
        typeof node.properties?.document?.strict_completion === "boolean"
            ? node.properties.document.strict_completion
            : true,
    );
    const [documentUploadError, setDocumentUploadError] = useState("");

    // Video specific
    const [videoSource, setVideoSource] = useState(
        node.properties?.video_source || "",
    );
    const [videoUrl, setVideoUrl] = useState(node.properties?.video_url || "");

    // Scheduled session specific
    const initialSessionKind = inferSessionKind(node.properties);
    const [sessionKind, setSessionKind] = useState(initialSessionKind);
    const [sessionProvider, setSessionProvider] = useState(
        inferSessionProvider(node.properties, initialSessionKind),
    );
    const [meetingPassword, setMeetingPassword] = useState(
        node.properties?.meeting_password || "",
    );
    const [timezone, setTimezone] = useState(node.properties?.timezone || "");
    const [recordingUrl, setRecordingUrl] = useState(
        node.properties?.recording_url || "",
    );
    const [venue, setVenue] = useState(node.properties?.venue || "");
    const [room, setRoom] = useState(node.properties?.room || "");
    const [address, setAddress] = useState(node.properties?.address || "");
    const [directions, setDirections] = useState(
        node.properties?.directions || "",
    );
    const [attendanceInstructions, setAttendanceInstructions] = useState(
        node.properties?.attendance_instructions || "",
    );
    const [sessionVisibility, setSessionVisibility] = useState(
        node.properties?.session_visibility || "private",
    );
    const [reminderMinutes, setReminderMinutes] = useState(
        node.properties?.reminder_minutes ?? 10,
    );
    const [attendanceThresholdPercent, setAttendanceThresholdPercent] = useState(
        node.properties?.attendance_threshold_percent ?? 50,
    );

    // Gamification settings (only used when featureFlags.gamification is true)
    const [gamificationSettings, setGamificationSettings] = useState(
        node.properties?.gamification || {},
    );

    // Validation state
    const [errors, setErrors] = useState({});
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    // Touched state - track which fields have been interacted with
    const [touched, setTouched] = useState({});

    // Detect if this is a new node (not yet saved to database)
    const isNew =
        !node.id ||
        node.id.toString().startsWith("temp_") ||
        node.title === "Untitled Lesson";

    const lessonType = (node.properties?.lesson_type || "text").toLowerCase();
    const isScheduledLesson = SCHEDULED_LESSON_TYPES.includes(lessonType);
    const hasPersistedNodeId =
        Boolean(node.id) && !String(node.id).startsWith("temp_");
    const inlineImageUploadUrl = hasPersistedNodeId
        ? `/instructor/nodes/${node.id}/images/upload/`
        : undefined;

    // Mark a field as touched
    const handleBlur = (fieldName) => {
        setTouched((prev) => ({ ...prev, [fieldName]: true }));
    };

    // Mark all fields as touched (used on submit attempt)
    const touchAllFields = () => {
        const nextTouched = {
            title: true,
            duration: true,
            description: true,
            content: true,
            videoSource: true,
            videoUrl: true,
            meetingPassword: true,
        };
        if (isScheduledLesson) {
            nextTouched.startDate = true;
            nextTouched.startTime = true;
            nextTouched.endDate = true;
            nextTouched.endTime = true;
            nextTouched.timezone = true;
            nextTouched.recordingUrl = true;
            nextTouched.venue = true;
            nextTouched.address = true;
        }
        if (lessonType === "document") {
            nextTouched.document = true;
        }
        setTouched(nextTouched);
    };

    // Get error for a field (only if touched)
    const getFieldError = (fieldName) => {
        return touched[fieldName] ? errors[fieldName] : undefined;
    };

    // Validation rules based on lesson type
    const validate = () => {
        const newErrors = {};

        // Common validations
        if (!title || title.trim().length < TITLE_MIN_LENGTH) {
            newErrors.title = `Title must be at least ${TITLE_MIN_LENGTH} characters`;
        } else if (title.length > TITLE_MAX_LENGTH) {
            newErrors.title = `Title must be ${TITLE_MAX_LENGTH} characters or less`;
        }

        if (!isScheduledLesson && (!duration || duration.trim() === "")) {
            newErrors.duration = "Duration is required";
        }

        // Strip HTML for character count
        const descText = description.replace(/<[^>]*>/g, "");
        if (!isScheduledLesson && (!descText || descText.length < 50)) {
            newErrors.description = "Description must be at least 50 characters";
        }

        const contentText = content.replace(/<[^>]*>/g, "");
        const requiresLessonContent = ![
            "document",
            "video",
            ...SCHEDULED_LESSON_TYPES,
        ].includes(lessonType);
        if (requiresLessonContent && (!contentText || contentText.length < 200)) {
            newErrors.content = "Content must be at least 200 characters";
        }

        // Video-specific validations
        if (lessonType === "video") {
            if (!videoSource) {
                newErrors.videoSource = "Please select a video source";
            }
            if (videoSource && (!videoUrl || videoUrl.trim() === "")) {
                newErrors.videoUrl = "Video URL is required";
            } else if (videoUrl && !/^https?:\/\/.+/.test(videoUrl)) {
                newErrors.videoUrl = "Please enter a valid URL";
            }
        }

        // Scheduled session validations
        if (isScheduledLesson) {
            if (
                sessionKind !== "in_person_session" &&
                sessionProvider !== "google_meet" &&
                (!videoUrl || !/^https:\/\/.+/.test(videoUrl))
            ) {
                newErrors.videoUrl = "A secure HTTPS session URL is required";
            }
            if (meetingPassword && meetingPassword.length < 6) {
                newErrors.meetingPassword =
                    "If provided, password must be at least 6 characters";
            }
            if (recordingUrl && !/^https:\/\/.+/.test(recordingUrl)) {
                newErrors.recordingUrl = "Use a secure HTTPS recording URL";
            }
            if (sessionKind === "in_person_session" && !venue.trim()) {
                newErrors.venue = "Venue is required";
            }
            if (sessionKind === "in_person_session" && !address.trim()) {
                newErrors.address = "Address is required";
            }
            if (!startDate) {
                newErrors.startDate = "Start date is required";
            }
            if (!startTime) {
                newErrors.startTime = "Start time is required";
            }
            if (!endDate) {
                newErrors.endDate = "End date is required";
            }
            if (!endTime) {
                newErrors.endTime = "End time is required";
            }
            if (startDate && startTime && endDate && endTime) {
                const start = new Date(`${startDate}T${startTime}:00`);
                const end = new Date(`${endDate}T${endTime}:00`);
                if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
                    newErrors.endTime = "End time must be after start time";
                }
            }
            if (!timezone) {
                newErrors.timezone = "Please select a timezone";
            }
        }

        if (lessonType === "document") {
            if (!documentData?.original_url) {
                newErrors.document =
                    "Primary document is required (PDF, DOCX, or PPTX)";
            } else {
                const conversionStatus = (
                    documentData?.conversion_status || ""
                ).toLowerCase();
                const pageCount = Number(documentData?.page_count || 0);
                if (
                    strictCompletion &&
                    (conversionStatus !== "ready" ||
                        !documentData?.viewer_pdf_url ||
                        pageCount <= 0)
                ) {
                    newErrors.document =
                        "Wait for document conversion to finish before saving strict mode.";
                }
            }
        }

        if (documentUploadError) {
            newErrors.document = documentUploadError;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isFormValid = () => {
        const descText = description.replace(/<[^>]*>/g, "");
        const contentText = content.replace(/<[^>]*>/g, "");
        const requiresLessonContent = ![
            "document",
            "video",
            ...SCHEDULED_LESSON_TYPES,
        ].includes(lessonType);

        if (
            !title ||
            title.trim().length < TITLE_MIN_LENGTH ||
            title.length > TITLE_MAX_LENGTH
        )
            return false;
        if (!isScheduledLesson && (!duration || duration.trim() === "")) return false;
        if (!isScheduledLesson && descText.length < 50) return false;
        if (requiresLessonContent && contentText.length < 200) return false;

        if (lessonType === "video") {
            if (!videoSource) return false;
            if (!videoUrl || !/^https?:\/\/.+/.test(videoUrl)) return false;
        }

        if (isScheduledLesson) {
            if (
                sessionKind !== "in_person_session" &&
                sessionProvider !== "google_meet" &&
                (!videoUrl || !/^https:\/\/.+/.test(videoUrl))
            )
                return false;
            if (meetingPassword && meetingPassword.length < 6) return false;
            if (recordingUrl && !/^https:\/\/.+/.test(recordingUrl)) return false;
            if (sessionKind === "in_person_session" && (!venue.trim() || !address.trim()))
                return false;
            if (!startDate || !startTime || !endDate || !endTime || !timezone)
                return false;
            const start = new Date(`${startDate}T${startTime}:00`);
            const end = new Date(`${endDate}T${endTime}:00`);
            if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start)
                return false;
        }

        if (lessonType === "document") {
            if (!documentData?.original_url) return false;
            if (strictCompletion) {
                const status = (documentData?.conversion_status || "").toLowerCase();
                const pageCount = Number(documentData?.page_count || 0);
                if (
                    status !== "ready" ||
                    !documentData?.viewer_pdf_url ||
                    pageCount <= 0
                ) {
                    return false;
                }
            }
        }

        if (documentUploadError) return false;

        return true;
    };

    const buildSavePayload = useCallback(() => {
        const documentPayload =
            lessonType === "document"
                ? {
                      ...(documentData || {}),
                      strict_completion: strictCompletion,
                  }
                : undefined;
        const baseProperties = { ...(node.properties || {}) };
        delete baseProperties.start_date;
        delete baseProperties.start_time;
        delete baseProperties.end_date;
        delete baseProperties.end_time;
        delete baseProperties.allow_join_anytime;
        delete baseProperties.host_video;
        delete baseProperties.participant_video;
        delete baseProperties.mute_upon_entry;
        delete baseProperties.require_auth;

        return {
            title,
            description,
            properties: {
                ...baseProperties,
                content,
                duration: isScheduledLesson
                    ? deriveSessionDuration(startDate, startTime, endDate, endTime)
                    : duration,
                is_preview: isPreview,
                video_source: videoSource,
                video_url: sessionKind === "in_person_session" ? "" : videoUrl,
                ...(isScheduledLesson && {
                    lesson_type: sessionKind,
                    session_kind: sessionKind,
                    provider: sessionProvider,
                    session_provider: sessionProvider,
                    session_visibility: sessionVisibility,
                    reminder_minutes: Number(reminderMinutes || 10),
                    attendance_threshold_percent: Number(
                        attendanceThresholdPercent || 50,
                    ),
                    session_url: sessionKind === "in_person_session" ? "" : videoUrl,
                    meeting_password:
                        sessionKind === "live_meeting" ? meetingPassword : "",
                    recording_url: recordingUrl,
                    timezone,
                    start_date: startDate,
                    start_time: startTime,
                    end_date: endDate,
                    end_time: endTime,
                    venue: sessionKind === "in_person_session" ? venue : "",
                    room: sessionKind === "in_person_session" ? room : "",
                    address: sessionKind === "in_person_session" ? address : "",
                    directions:
                        sessionKind === "in_person_session" ? directions : "",
                    attendance_instructions: attendanceInstructions,
                }),
                ...(lessonType === "document" && {
                    document: documentPayload,
                }),
                ...(featureFlags.gamification && {
                    gamification: gamificationSettings,
                }),
            },
        };
    }, [
        address,
        attendanceInstructions,
        attendanceThresholdPercent,
        content,
        description,
        documentData,
        duration,
        endDate,
        endTime,
        featureFlags.gamification,
        gamificationSettings,
        isPreview,
        isScheduledLesson,
        lessonType,
        meetingPassword,
        node.properties,
        recordingUrl,
        reminderMinutes,
        room,
        sessionKind,
        sessionProvider,
        sessionVisibility,
        startDate,
        startTime,
        strictCompletion,
        timezone,
        title,
        venue,
        videoSource,
        videoUrl,
        directions,
    ]);

    const savePayload = useCallback(
        (payload, callbacks = {}) => {
            onSave(node.id, payload, callbacks);
        },
        [node.id, onSave],
    );

    const autosaveValue = useMemo(
        () => ({
            address,
            attendanceInstructions,
            attendanceThresholdPercent,
            content,
            description,
            documentData,
            duration,
            endDate,
            endTime,
            gamificationSettings,
            isPreview,
            lessonType,
            meetingPassword,
            recordingUrl,
            reminderMinutes,
            room,
            sessionKind,
            sessionProvider,
            sessionVisibility,
            startDate,
            startTime,
            strictCompletion,
            timezone,
            title,
            venue,
            videoSource,
            videoUrl,
            directions,
        }),
        [
            address,
            attendanceInstructions,
            attendanceThresholdPercent,
            content,
            description,
            documentData,
            duration,
            endDate,
            endTime,
            gamificationSettings,
            isPreview,
            lessonType,
            meetingPassword,
            recordingUrl,
            reminderMinutes,
            room,
            sessionKind,
            sessionProvider,
            sessionVisibility,
            startDate,
            startTime,
            strictCompletion,
            timezone,
            title,
            venue,
            videoSource,
            videoUrl,
            directions,
        ],
    );

    const autosave = useAutosave({
        enabled: hasPersistedNodeId,
        value: autosaveValue,
        buildPayload: buildSavePayload,
        save: savePayload,
        debounceMs: 1800,
        saveKey: `content:${node.id}`,
    });

    useImperativeHandle(
        ref,
        () => ({
            flushAutosave: autosave.flush,
        }),
        [autosave.flush],
    );

    const handleSave = () => {
        touchAllFields();
        if (!validate()) {
            setSnackbar({
                open: true,
                message: "Please fix the validation errors",
                severity: "error",
            });
            return;
        }

        void autosave.flush({
            force: true,
            onSuccess: () => {
                setSnackbar({
                    open: true,
                    message: "Lesson saved successfully!",
                    severity: "success",
                });
            },
            onError: () => {
                setSnackbar({
                    open: true,
                    message: "Could not save the lesson. Please try again.",
                    severity: "error",
                });
            },
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Determine icon and label based on type
    const getHeaderInfo = () => {
        switch (lessonType) {
            case "video":
                return { icon: <VideoIcon />, label: "Video lesson" };
            case "document":
                return { icon: <DocumentIcon />, label: "Document lesson" };
            case "live_class":
            case "live_meeting":
                return { icon: <ZoomIcon />, label: "Live meeting" };
            case "live_stream":
                return { icon: <ZoomIcon />, label: "Live stream" };
            case "in_person_session":
                return { icon: <ZoomIcon />, label: "In-person session" };
            case "assignment":
                return { icon: <AssignmentIcon />, label: "Assignment" };
            default:
                return { icon: <ArticleIcon />, label: "Text lesson" };
        }
    };

    const { icon, label } = getHeaderInfo();
    const requiresLessonContent = ![
        "document",
        "video",
        ...SCHEDULED_LESSON_TYPES,
    ].includes(lessonType);
    const trimmedTitleLength = title.trim().length;
    const descriptionTextLength = description.replace(/<[^>]*>/g, "").length;
    const contentTextLength = content.replace(/<[^>]*>/g, "").length;
    const titleMinLengthError =
        title.length > 0 && trimmedTitleLength < TITLE_MIN_LENGTH
            ? `Enter at least ${TITLE_MIN_LENGTH} characters.`
            : undefined;
    const titleMaxLengthError =
        title.length > TITLE_MAX_LENGTH
            ? `Use ${TITLE_MAX_LENGTH} characters or fewer.`
            : undefined;
    const titleErrorMessage =
        getFieldError("title") || titleMinLengthError || titleMaxLengthError;
    const descriptionMinLengthError =
        !isScheduledLesson && descriptionTextLength > 0 && descriptionTextLength < 50
            ? "Enter at least 50 characters."
            : undefined;
    const contentMinLengthError =
        requiresLessonContent && contentTextLength > 0 && contentTextLength < 200
            ? "Enter at least 200 characters."
            : undefined;
    const descriptionErrorMessage =
        getFieldError("description") || descriptionMinLengthError;
    const contentErrorMessage = getFieldError("content") || contentMinLengthError;

    return (
        <Box>
            {/* Editor Header */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Box
                    sx={{
                        mr: 2,
                        display: "flex",
                        alignItems: "center",
                        color: "text.secondary",
                    }}
                >
                    {icon}
                    <Typography
                        variant="body2"
                        sx={{ ml: 1, textTransform: "capitalize" }}
                    >
                        {label}
                    </Typography>
                </Box>
                <TextField
                    variant="standard"
                    placeholder="Enter lesson name *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => handleBlur("title")}
                    fullWidth
                    error={!!titleErrorMessage}
                    helperText={titleErrorMessage}
                    InputProps={{ sx: { fontSize: "1.2rem", fontWeight: 500 } }}
                />
                <Box sx={{ ml: 2, display: "flex", alignItems: "center" }}>
                    <AutosaveStatus
                        status={autosave.status}
                        lastSavedAt={autosave.lastSavedAt}
                        disabledReason="Create the lesson before autosave can start."
                    />
                </Box>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    size="medium"
                    sx={{ ml: 2 }}
                    disabled={!isFormValid()}
                >
                    {isNew ? "Create" : "Save"}
                </Button>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                    <Tab
                        key="lesson"
                        label="Lesson"
                        value="lesson"
                        sx={{ textTransform: "none", minWidth: 100 }}
                    />
                    <Tab
                        key="qa"
                        label="Q&A"
                        value="qa"
                        sx={{ textTransform: "none", minWidth: 100 }}
                    />
                </Tabs>
            </Box>

            {activeTab === "lesson" && (
                <Stack spacing={3}>
                    {/* --- Video Lesson Specifics --- */}
                    {lessonType === "video" && (
                        <Box>
                            <InputLabel
                                shrink
                                sx={{
                                    mb: 1,
                                    fontWeight: 500,
                                    color: getFieldError("videoSource")
                                        ? "error.main"
                                        : "inherit",
                                }}
                            >
                                Source type *
                            </InputLabel>
                            <FormControl
                                fullWidth
                                size="small"
                                error={!!getFieldError("videoSource")}
                            >
                                <Select
                                    value={videoSource}
                                    onChange={(e) =>
                                        setVideoSource(e.target.value)
                                    }
                                    onBlur={() => handleBlur("videoSource")}
                                    displayEmpty
                                >
                                    <MenuItem value="" disabled>
                                        Select source
                                    </MenuItem>
                                    <MenuItem value="html5">
                                        HTML5 (MP4)
                                    </MenuItem>
                                    <MenuItem value="youtube">YouTube</MenuItem>
                                    <MenuItem value="vimeo">Vimeo</MenuItem>
                                    <MenuItem value="external">
                                        External Link
                                    </MenuItem>
                                </Select>
                                {getFieldError("videoSource") && (
                                    <FormHelperText>
                                        {getFieldError("videoSource")}
                                    </FormHelperText>
                                )}
                            </FormControl>
                            {videoSource && (
                                <Box sx={{ mt: 2 }}>
                                    <InputLabel
                                        htmlFor="lesson-video-url"
                                        shrink
                                        required
                                        error={!!getFieldError("videoUrl")}
                                        sx={{ mb: 1, fontWeight: 500 }}
                                    >
                                        Video URL
                                    </InputLabel>
                                    <TextField
                                        id="lesson-video-url"
                                        placeholder="Paste the video URL"
                                        fullWidth
                                        size="small"
                                        value={videoUrl}
                                        onChange={(e) =>
                                            setVideoUrl(e.target.value)
                                        }
                                        onBlur={() => handleBlur("videoUrl")}
                                        error={!!getFieldError("videoUrl")}
                                        helperText={getFieldError("videoUrl")}
                                        required
                                    />
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* --- Scheduled learning session specifics --- */}
                    {isScheduledLesson && (
                        <ScheduledSessionFields
                            values={{
                                sessionKind,
                                sessionProvider,
                                sessionVisibility,
                                reminderMinutes,
                                attendanceThresholdPercent,
                                videoUrl,
                                meetingPassword,
                                recordingUrl,
                                startDate,
                                startTime,
                                endDate,
                                endTime,
                                timezone,
                                venue,
                                room,
                                address,
                                directions,
                                attendanceInstructions,
                            }}
                            errors={{
                                videoUrl: getFieldError("videoUrl"),
                                meetingPassword: getFieldError("meetingPassword"),
                                recordingUrl: getFieldError("recordingUrl"),
                                startDate: getFieldError("startDate"),
                                startTime: getFieldError("startTime"),
                                endDate: getFieldError("endDate"),
                                endTime: getFieldError("endTime"),
                                timezone: getFieldError("timezone"),
                                venue: getFieldError("venue"),
                                address: getFieldError("address"),
                            }}
                            nodeId={node.id}
                            persisted={hasPersistedNodeId}
                            onBlur={handleBlur}
                            onSaveBeforeMeet={() =>
                                autosave.flush({ force: true })
                            }
                            onChange={(changes) => {
                                if (Object.hasOwn(changes, "sessionKind")) setSessionKind(changes.sessionKind);
                                if (Object.hasOwn(changes, "sessionProvider")) setSessionProvider(changes.sessionProvider);
                                if (Object.hasOwn(changes, "sessionVisibility")) setSessionVisibility(changes.sessionVisibility);
                                if (Object.hasOwn(changes, "reminderMinutes")) setReminderMinutes(changes.reminderMinutes);
                                if (Object.hasOwn(changes, "attendanceThresholdPercent")) setAttendanceThresholdPercent(changes.attendanceThresholdPercent);
                                if (Object.hasOwn(changes, "videoUrl")) setVideoUrl(changes.videoUrl);
                                if (Object.hasOwn(changes, "meetingPassword")) setMeetingPassword(changes.meetingPassword);
                                if (Object.hasOwn(changes, "recordingUrl")) setRecordingUrl(changes.recordingUrl);
                                if (Object.hasOwn(changes, "startDate")) setStartDate(changes.startDate);
                                if (Object.hasOwn(changes, "startTime")) setStartTime(changes.startTime);
                                if (Object.hasOwn(changes, "endDate")) setEndDate(changes.endDate);
                                if (Object.hasOwn(changes, "endTime")) setEndTime(changes.endTime);
                                if (Object.hasOwn(changes, "timezone")) setTimezone(changes.timezone);
                                if (Object.hasOwn(changes, "venue")) setVenue(changes.venue);
                                if (Object.hasOwn(changes, "room")) setRoom(changes.room);
                                if (Object.hasOwn(changes, "address")) setAddress(changes.address);
                                if (Object.hasOwn(changes, "directions")) setDirections(changes.directions);
                                if (Object.hasOwn(changes, "attendanceInstructions")) {
                                    setAttendanceInstructions(changes.attendanceInstructions);
                                }
                            }}
                        />
                    )}
                    {/* --- Common Settings (Duration & Preview) --- */}
                    {!isScheduledLesson && (
                        <Box
                            sx={{
                                display: "flex",
                                gap: 4,
                                flexWrap: "wrap",
                                alignItems: "flex-start",
                            }}
                        >
                            <Box sx={{ width: 250 }}>
                                <InputLabel
                                    htmlFor="lesson-duration"
                                    shrink
                                    required
                                    error={!!getFieldError("duration")}
                                    sx={{ mb: 1, fontWeight: 500 }}
                                >
                                    Lesson duration
                                </InputLabel>
                                <TextField
                                    id="lesson-duration"
                                    placeholder="Example: 2h 45m"
                                    size="small"
                                    fullWidth
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    onBlur={() => handleBlur("duration")}
                                    error={!!getFieldError("duration")}
                                    helperText={getFieldError("duration")}
                                    required
                                />
                            </Box>
                        </Box>
                    )}

                    {/* Common Toggles */}
                    {!isScheduledLesson && <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                        }}
                    >
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isPreview}
                                    onChange={(e) =>
                                        setIsPreview(e.target.checked)
                                    }
                                />
                            }
                            label={
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography variant="body2">
                                        Lesson preview
                                    </Typography>
                                    <Tooltip
                                        title="Enable this to allow non-enrolled users to preview this lesson for free"
                                        arrow
                                    >
                                        <InfoIcon
                                            fontSize="small"
                                            sx={{
                                                ml: 1,
                                                color: "primary.main",
                                                fontSize: 16,
                                                cursor: "help",
                                            }}
                                        />
                                    </Tooltip>
                                </Box>
                            }
                        />
                    </Box>}

                    {/* Rich Text Editor - Short Description */}
                    <Box
                        sx={{ mt: 2 }}
                        onBlur={() => handleBlur("description")}
                    >
                        <Typography
                            variant="body2"
                            color={
                                descriptionErrorMessage
                                    ? "error"
                                    : "text.secondary"
                            }
                            sx={{ mb: 1, fontWeight: "bold" }}
                        >
                            {isScheduledLesson
                                ? "Summary (optional)"
                                : "Short description of the lesson *"}
                        </Typography>
                        <RichTextEditor
                            value={description}
                            onChange={setDescription}
                            placeholder={
                                isScheduledLesson
                                    ? "Optional class summary"
                                    : "Enter a brief description of the lesson (min 50 characters)..."
                            }
                            minHeight={100}
                            imageUploadUrl={inlineImageUploadUrl}
                        />
                        {descriptionErrorMessage && (
                            <FormHelperText error>
                                {descriptionErrorMessage}
                            </FormHelperText>
                        )}
                        <Typography variant="caption" color="text.secondary">
                            {descriptionTextLength} characters
                        </Typography>
                    </Box>

                    {/* Document Lesson - Primary File */}
                    {lessonType === "document" && (
                        <Box sx={{ mt: 2 }}>
                            <Typography
                                variant="body2"
                                color={
                                    getFieldError("document")
                                        ? "error"
                                        : "text.secondary"
                                }
                                sx={{ mb: 1, fontWeight: "bold" }}
                            >
                                Primary document *
                            </Typography>
                            <DocumentPrimaryUploader
                                nodeId={node.id}
                                documentData={documentData}
                                onDocumentChange={(nextDocument) => {
                                    setDocumentData(nextDocument);
                                    setDocumentUploadError("");
                                    setTouched((prev) => ({
                                        ...prev,
                                        document: true,
                                    }));
                                }}
                                onError={(message) => {
                                    setDocumentUploadError(message || "");
                                    setTouched((prev) => ({
                                        ...prev,
                                        document: true,
                                    }));
                                }}
                            />
                            {getFieldError("document") && (
                                <FormHelperText error>
                                    {getFieldError("document")}
                                </FormHelperText>
                            )}
                            <FormControlLabel
                                sx={{ mt: 1 }}
                                control={
                                    <Switch
                                        checked={strictCompletion}
                                        onChange={(e) =>
                                            setStrictCompletion(
                                                e.target.checked,
                                            )
                                        }
                                    />
                                }
                                label={
                                    <Typography variant="body2">
                                        Prevent complete until fully read
                                    </Typography>
                                }
                            />
                        </Box>
                    )}

                    {/* Rich Text Editor - Lesson Content */}
                    <Box sx={{ mt: 2 }} onBlur={() => handleBlur("content")}>
                        <Typography
                            variant="body2"
                            color={
                                requiresLessonContent &&
                                contentErrorMessage
                                    ? "error"
                                    : "text.secondary"
                            }
                            sx={{ mb: 1, fontWeight: "bold" }}
                        >
                            {lessonType === "document" || lessonType === "video"
                                ? "Lesson content (optional)"
                                : "Lesson content *"}
                        </Typography>
                        <RichTextEditor
                            value={content}
                            onChange={setContent}
                            placeholder={
                                lessonType === "document"
                                    ? "Optional notes for this document lesson..."
                                    : lessonType === "video"
                                      ? "Optional notes for this video lesson..."
                                      : "Write your lesson content here (min 200 characters)..."
                            }
                            minHeight={250}
                            imageUploadUrl={inlineImageUploadUrl}
                        />
                        {requiresLessonContent &&
                            contentErrorMessage && (
                            <FormHelperText error>
                                {contentErrorMessage}
                            </FormHelperText>
                            )}
                        <Typography variant="caption" color="text.secondary">
                            {contentTextLength} characters
                        </Typography>
                    </Box>

                    {/* Lesson Materials */}
                    <Box sx={{ mt: 3 }}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                        >
                            Lesson materials
                        </Typography>
                        <FileUploader
                            nodeId={node.id}
                            files={files}
                            onUploadComplete={(newFile) =>
                                setFiles([...files, newFile])
                            }
                            onDeleteComplete={(fileId) =>
                                setFiles(files.filter((f) => f.id !== fileId))
                            }
                        />
                    </Box>

                    {/* Gamification Settings - Only show when enabled */}
                    {featureFlags.gamification && (
                        <GamificationSettings
                            properties={{ gamification: gamificationSettings }}
                            onChange={(props) =>
                                setGamificationSettings(props.gamification)
                            }
                        />
                    )}

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 2,
                            mt: 4,
                        }}
                    >
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            size="large"
                            disabled={!isFormValid()}
                        >
                            {isNew ? "Create" : "Save"}
                        </Button>
                    </Box>
                </Stack>
            )}

            {activeTab === "qa" && <QATab nodeId={node.id} />}

            {/* Success/Error Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
});

export default ContentEditor;

// Q&A Tab Component
// Now receives discussions as props from parent (passed from backend)
function QATab({ nodeId, discussions: initialDiscussions = [] }) {
    const [discussions, setDiscussions] = useState(initialDiscussions);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [creating, setCreating] = useState(false);
    const [replyDrafts, setReplyDrafts] = useState({});
    const [replyingById, setReplyingById] = useState({});

    const loadDiscussions = useCallback(async () => {
        if (!nodeId || String(nodeId).startsWith("temp_")) {
            setDiscussions([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/instructor/nodes/${nodeId}/discussions/`, {
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                },
            });
            if (!response.ok) {
                throw new Error("Failed to load discussions");
            }
            const data = await response.json();
            setDiscussions(Array.isArray(data.discussions) ? data.discussions : []);
        } catch (err) {
            setError(err?.message || "Failed to load discussions");
        } finally {
            setLoading(false);
        }
    }, [nodeId]);

    useEffect(() => {
        loadDiscussions();
    }, [loadDiscussions]);

    const handleCreate = () => {
        if (!newTitle.trim()) return;
        setCreating(true);

        // Use Inertia router.post() - backend redirects back with updated data
        router.post(
            `/instructor/nodes/${nodeId}/discussions/create/`,
            {
                title: newTitle,
                content: newContent,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCreateOpen(false);
                    setNewTitle("");
                    setNewContent("");
                    loadDiscussions();
                },
                onFinish: () => setCreating(false),
            },
        );
    };

    const handleTogglePin = (discussionId) => {
        // Use Inertia router.post() - backend redirects back with updated data
        router.post(
            `/instructor/discussions/${discussionId}/toggle-pin/`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => loadDiscussions(),
            },
        );
    };

    const handleToggleLock = (discussionId) => {
        // Use Inertia router.post() - backend redirects back with updated data
        router.post(
            `/instructor/discussions/${discussionId}/toggle-lock/`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => loadDiscussions(),
            },
        );
    };

    const handleReply = (discussionId) => {
        const content = (replyDrafts[discussionId] || "").trim();
        if (!content) return;

        setReplyingById((prev) => ({ ...prev, [discussionId]: true }));
        router.post(
            "/instructor/discussions/reply/",
            {
                thread: discussionId,
                content,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReplyDrafts((prev) => ({ ...prev, [discussionId]: "" }));
                    loadDiscussions();
                },
                onFinish: () => {
                    setReplyingById((prev) => ({ ...prev, [discussionId]: false }));
                },
            },
        );
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <Box sx={{ py: 8, textAlign: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                }}
            >
                <Typography variant="h6">Discussions</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateOpen(true)}
                    size="small"
                >
                    New Discussion
                </Button>
            </Box>

            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            )}

            {/* Discussion List */}
            {discussions.length === 0 ? (
                <Box
                    sx={{ textAlign: "center", py: 6, color: "text.secondary" }}
                >
                    <ChatIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                    <Typography>No discussions yet for this lesson.</Typography>
                    <Typography variant="body2">
                        Start a discussion to engage with students.
                    </Typography>
                </Box>
            ) : (
                <List disablePadding>
                    {discussions.map((d) => (
                        <ListItem
                            key={d.id}
                            divider
                            sx={{
                                bgcolor: d.is_pinned
                                    ? "action.hover"
                                    : "transparent",
                                borderRadius: 1,
                            }}
                        >
                            <ListItemText
                                primary={
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                        }}
                                    >
                                        {d.is_pinned && (
                                            <PinIcon
                                                sx={{
                                                    fontSize: 16,
                                                    color: "warning.main",
                                                }}
                                            />
                                        )}
                                        {d.is_locked && (
                                            <LockIcon
                                                sx={{
                                                    fontSize: 16,
                                                    color: "text.secondary",
                                                }}
                                            />
                                        )}
                                        <Typography variant="subtitle2">
                                            {d.title}
                                        </Typography>
                                    </Box>
                                }
                                secondary={
                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 2,
                                            mt: 0.5,
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {d.author}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {formatDate(d.created_at)}
                                        </Typography>
                                        <Chip
                                            label={`${d.replies_count} replies`}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                height: 18,
                                                fontSize: "0.7rem",
                                            }}
                                        />
                                    </Box>
                                }
                            />
                            <Box sx={{ minWidth: 300, ml: 2 }}>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        placeholder="Write a reply..."
                                        value={replyDrafts[d.id] || ""}
                                        disabled={!!d.is_locked || !!replyingById[d.id]}
                                        onChange={(event) =>
                                            setReplyDrafts((prev) => ({
                                                ...prev,
                                                [d.id]: event.target.value,
                                            }))
                                        }
                                    />
                                    <Button
                                        variant="contained"
                                        size="small"
                                        disabled={
                                            !!d.is_locked ||
                                            !!replyingById[d.id] ||
                                            !(replyDrafts[d.id] || "").trim()
                                        }
                                        onClick={() => handleReply(d.id)}
                                    >
                                        Reply
                                    </Button>
                                </Box>
                            </Box>
                            <ListItemSecondaryAction>
                                <Tooltip title={d.is_pinned ? "Unpin" : "Pin"}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleTogglePin(d.id)}
                                    >
                                        <PinIcon
                                            sx={{
                                                fontSize: 18,
                                                color: d.is_pinned
                                                    ? "warning.main"
                                                    : "text.disabled",
                                            }}
                                        />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip
                                    title={d.is_locked ? "Unlock" : "Lock"}
                                >
                                    <IconButton
                                        size="small"
                                        onClick={() => handleToggleLock(d.id)}
                                    >
                                        {d.is_locked ? (
                                            <LockIcon
                                                sx={{
                                                    fontSize: 18,
                                                    color: "text.secondary",
                                                }}
                                            />
                                        ) : (
                                            <LockOpenIcon
                                                sx={{
                                                    fontSize: 18,
                                                    color: "text.disabled",
                                                }}
                                            />
                                        )}
                                    </IconButton>
                                </Tooltip>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            )}

            {/* Create Discussion Dialog */}
            <Dialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Start a Discussion</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Title"
                        fullWidth
                        variant="outlined"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Content (optional)"
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setCreateOpen(false)}
                        disabled={creating}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCreate}
                        disabled={!newTitle.trim() || creating}
                    >
                        {creating ? <CircularProgress size={20} /> : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
