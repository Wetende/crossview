import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
    Paper, 
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
    FormHelperText
} from '@mui/material';
import RichTextEditor from '@/components/RichTextEditor';
import FileUploader from '@/components/FileUploader';
import GamificationSettings from '../components/GamificationSettings';
import {
    Article as ArticleIcon,
    OndemandVideo as VideoIcon,
    VideoCameraFront as ZoomIcon,
    Assignment as AssignmentIcon,
    InfoOutlined as InfoIcon,
    Add as AddIcon,
    PushPin as PinIcon,
    Lock as LockIcon,
    LockOpen as LockOpenIcon,
    ChatBubbleOutline as ChatIcon
} from '@mui/icons-material';

// Configure axios for CSRF (required when mixing with session auth)
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

export default function ContentEditor({ node, onSave, blueprint }) {
    // Get feature flags from blueprint
    const featureFlags = blueprint?.featureFlags || {};
    const [title, setTitle] = useState(node.title);
    const [activeTab, setActiveTab] = useState('lesson');
    const [description, setDescription] = useState(node.description || '');
    const [content, setContent] = useState(node.properties?.content || '');
    const [duration, setDuration] = useState(node.properties?.duration || '');
    const [isPreview, setIsPreview] = useState(node.properties?.is_preview || false);
    const [isLocked, setIsLocked] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [files, setFiles] = useState(node.properties?.files || []);
    
    // Video specific
    const [videoSource, setVideoSource] = useState(node.properties?.video_source || '');
    const [videoUrl, setVideoUrl] = useState(node.properties?.video_url || '');

    // Live Class (Zoom) specific
    const [meetingPassword, setMeetingPassword] = useState(node.properties?.meeting_password || '');
    const [timezone, setTimezone] = useState(node.properties?.timezone || '');
    const [allowJoinAnytime, setAllowJoinAnytime] = useState(node.properties?.allow_join_anytime || false);
    const [hostVideo, setHostVideo] = useState(node.properties?.host_video || false);
    const [participantVideo, setParticipantVideo] = useState(node.properties?.participant_video || false);
    const [muteUponEntry, setMuteUponEntry] = useState(node.properties?.mute_upon_entry || false);
    const [requireAuth, setRequireAuth] = useState(node.properties?.require_auth || false);
    
    // Gamification settings (only used when featureFlags.gamification is true)
    const [gamificationSettings, setGamificationSettings] = useState(node.properties?.gamification || {});

    // Validation state
    const [errors, setErrors] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    
    // Touched state - track which fields have been interacted with
    const [touched, setTouched] = useState({});
    
    // Detect if this is a new node (not yet saved to database)
    const isNew = !node.id || node.id.toString().startsWith('temp_') || node.title === 'Untitled Lesson';

    const lessonType = node.properties?.lesson_type || 'text';
    
    // Mark a field as touched
    const handleBlur = (fieldName) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
    };
    
    // Mark all fields as touched (used on submit attempt)
    const touchAllFields = () => {
        setTouched({
            title: true,
            duration: true,
            description: true,
            content: true,
            videoSource: true,
            videoUrl: true,
            meetingPassword: true,
            startDate: true,
            startTime: true,
            timezone: true,
        });
    };
    
    // Get error for a field (only if touched)
    const getFieldError = (fieldName) => {
        return touched[fieldName] ? errors[fieldName] : undefined;
    };

    // Validation rules based on lesson type
    const validate = () => {
        const newErrors = {};
        
        // Common validations
        if (!title || title.trim().length < 5) {
            newErrors.title = 'Title must be at least 5 characters';
        } else if (title.length > 100) {
            newErrors.title = 'Title must be 100 characters or less';
        }
        
        if (!duration || duration.trim() === '') {
            newErrors.duration = 'Duration is required';
        }
        
        // Strip HTML for character count
        const descText = description.replace(/<[^>]*>/g, '');
        if (!descText || descText.length < 50) {
            newErrors.description = `Description must be at least 50 characters (${descText.length}/50)`;
        }
        
        const contentText = content.replace(/<[^>]*>/g, '');
        if (!contentText || contentText.length < 200) {
            newErrors.content = `Content must be at least 200 characters (${contentText.length}/200)`;
        }
        
        // Video-specific validations
        if (lessonType === 'video') {
            if (!videoSource) {
                newErrors.videoSource = 'Please select a video source';
            }
            if (videoSource && (!videoUrl || videoUrl.trim() === '')) {
                newErrors.videoUrl = 'Video URL is required';
            } else if (videoUrl && !/^https?:\/\/.+/.test(videoUrl)) {
                newErrors.videoUrl = 'Please enter a valid URL';
            }
        }
        
        // Live class-specific validations
        if (lessonType === 'live_class') {
            if (!meetingPassword || meetingPassword.length < 6) {
                newErrors.meetingPassword = 'Password must be at least 6 characters';
            }
            if (!startDate) {
                newErrors.startDate = 'Start date is required';
            }
            if (!startTime) {
                newErrors.startTime = 'Start time is required';
            }
            if (!timezone) {
                newErrors.timezone = 'Please select a timezone';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isFormValid = () => {
        const descText = description.replace(/<[^>]*>/g, '');
        const contentText = content.replace(/<[^>]*>/g, '');
        
        if (!title || title.trim().length < 5 || title.length > 100) return false;
        if (!duration || duration.trim() === '') return false;
        if (descText.length < 50) return false;
        if (contentText.length < 200) return false;
        
        if (lessonType === 'video') {
            if (!videoSource) return false;
            if (!videoUrl || !/^https?:\/\/.+/.test(videoUrl)) return false;
        }
        
        if (lessonType === 'live_class') {
            if (!meetingPassword || meetingPassword.length < 6) return false;
            if (!startDate || !startTime || !timezone) return false;
        }
        
        return true;
    };

    const handleSave = () => {
        touchAllFields();
        if (!validate()) {
            setSnackbar({ open: true, message: 'Please fix the validation errors', severity: 'error' });
            return;
        }
        
        onSave(node.id, {
            title,
            description,
            properties: { 
                ...node.properties,
                content,
                duration,
                is_preview: isPreview,
                start_date: startDate,
                start_time: startTime,
                video_source: videoSource,
                video_url: videoUrl,
                meeting_password: meetingPassword,
                timezone,
                allow_join_anytime: allowJoinAnytime,
                host_video: hostVideo,
                participant_video: participantVideo,
                mute_upon_entry: muteUponEntry,
                require_auth: requireAuth,
                ...(featureFlags.gamification && { gamification: gamificationSettings }),
            }
        });
        
        setSnackbar({ open: true, message: 'Lesson saved successfully!', severity: 'success' });
    };
    
    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };
    
    // Determine icon and label based on type
    const getHeaderInfo = () => {
        switch (lessonType) {
            case 'video': return { icon: <VideoIcon />, label: 'Video lesson' };
            case 'live_class': return { icon: <ZoomIcon />, label: 'Live class' }; 
            case 'assignment': return { icon: <AssignmentIcon />, label: 'Assignment' };
            default: return { icon: <ArticleIcon />, label: 'Text lesson' };
        }
    };
    
    const { icon, label } = getHeaderInfo();

    return (
        <Box>
            {/* Editor Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
               <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                   {icon}
                   <Typography variant="body2" sx={{ ml: 1, textTransform: 'capitalize' }}>
                       {label}
                   </Typography>
               </Box>
               <TextField 
                   variant="standard" 
                   placeholder="Enter lesson name *" 
                   value={title} 
                   onChange={e => setTitle(e.target.value)}
                   onBlur={() => handleBlur('title')}
                   fullWidth
                   error={!!getFieldError('title')}
                   helperText={getFieldError('title') || `${title.length}/100 characters`}
                   InputProps={{ sx: { fontSize: '1.2rem', fontWeight: 500 } }}
               />
               <Button variant="contained" onClick={handleSave} size="medium" sx={{ ml: 2 }} disabled={!isFormValid()}>
                   {isNew ? 'Create' : 'Save'}
               </Button>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                    <Tab key="lesson" label="Lesson" value="lesson" sx={{ textTransform: 'none', minWidth: 100 }} />
                    <Tab key="qa" label="Q&A" value="qa" sx={{ textTransform: 'none', minWidth: 100 }} />
                </Tabs>
            </Box>

            {activeTab === 'lesson' && (
                <Stack spacing={3}>
                    
                    {/* --- Video Lesson Specifics --- */}
                    {lessonType === 'video' && (
                        <Box>
                            <InputLabel shrink sx={{ mb: 1, fontWeight: 500, color: getFieldError('videoSource') ? 'error.main' : 'inherit' }}>
                                Source type *
                            </InputLabel>
                            <FormControl fullWidth size="small" error={!!getFieldError('videoSource')}>
                                <Select
                                    value={videoSource}
                                    onChange={e => setVideoSource(e.target.value)}
                                    onBlur={() => handleBlur('videoSource')}
                                    displayEmpty
                                >
                                    <MenuItem value="" disabled>Select source</MenuItem>
                                    <MenuItem value="html5">HTML5 (MP4)</MenuItem>
                                    <MenuItem value="youtube">YouTube</MenuItem>
                                    <MenuItem value="vimeo">Vimeo</MenuItem>
                                    <MenuItem value="external">External Link</MenuItem>
                                </Select>
                                {getFieldError('videoSource') && <FormHelperText>{getFieldError('videoSource')}</FormHelperText>}
                            </FormControl>
                            {videoSource && (
                                <TextField 
                                    sx={{ mt: 2 }}
                                    label="Video URL *" 
                                    fullWidth 
                                    size="small"
                                    value={videoUrl} 
                                    onChange={e => setVideoUrl(e.target.value)}
                                    onBlur={() => handleBlur('videoUrl')}
                                    error={!!getFieldError('videoUrl')}
                                    helperText={getFieldError('videoUrl')}
                                    required
                                />
                            )}
                        </Box>
                    )}

                    {/* --- Live Class (Zoom) Specifics --- */}
                    {lessonType === 'live_class' && (
                        <Stack spacing={2}>
                             <TextField 
                                label="Meeting password *" 
                                placeholder="Enter password (min 6 characters)"
                                fullWidth
                                size="small"
                                value={meetingPassword}
                                onChange={e => setMeetingPassword(e.target.value)}
                                onBlur={() => handleBlur('meetingPassword')}
                                error={!!getFieldError('meetingPassword')}
                                helperText={getFieldError('meetingPassword')}
                                InputLabelProps={{ shrink: true, sx: { fontWeight: 500 } }}
                                required
                             />
                             
                             <Box sx={{ display: 'flex', gap: 2 }}>
                                 <TextField 
                                    label="Select start date *" 
                                    type="date"
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true, sx: { fontWeight: 500 } }}
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    onBlur={() => handleBlur('startDate')}
                                    error={!!getFieldError('startDate')}
                                    helperText={getFieldError('startDate')}
                                    required
                                 />
                                 <TextField 
                                    label="Select start time *" 
                                    type="time"
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true, sx: { fontWeight: 500 } }}
                                    value={startTime}
                                    onChange={e => setStartTime(e.target.value)}
                                    onBlur={() => handleBlur('startTime')}
                                    error={!!getFieldError('startTime')}
                                    helperText={getFieldError('startTime')}
                                    required
                                 />
                             </Box>

                             <TextField 
                                label="Lesson duration *" 
                                placeholder="Example: 2h 45m"
                                fullWidth
                                size="small"
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                onBlur={() => handleBlur('duration')}
                                error={!!getFieldError('duration')}
                                helperText={getFieldError('duration')}
                                InputLabelProps={{ shrink: true, sx: { fontWeight: 500 } }}
                                required
                             />
                             
                             <FormControl fullWidth size="small" error={!!getFieldError('timezone')}>
                                <InputLabel shrink sx={{ fontWeight: 500 }}>Timezone *</InputLabel>
                                <Select
                                    value={timezone}
                                    onChange={e => setTimezone(e.target.value)}
                                    onBlur={() => handleBlur('timezone')}
                                    label="Timezone *"
                                    displayEmpty
                                >
                                    <MenuItem value="" disabled>Select timezone</MenuItem>
                                    <MenuItem value="UTC">UTC</MenuItem>
                                    <MenuItem value="PST">PST</MenuItem>
                                    <MenuItem value="EST">EST</MenuItem>
                                </Select>
                                {getFieldError('timezone') && <FormHelperText>{getFieldError('timezone')}</FormHelperText>}
                             </FormControl>

                             {/* Toggle Grid */}
                             <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                 <FormControlLabel 
                                    control={<Switch checked={allowJoinAnytime} onChange={e => setAllowJoinAnytime(e.target.checked)} />}
                                    label={<Typography variant="body2">Allow participants to join anytime</Typography>}
                                 />
                                 <FormControlLabel 
                                    control={<Switch checked={hostVideo} onChange={e => setHostVideo(e.target.checked)} />}
                                    label={<Typography variant="body2">Host video</Typography>}
                                 />
                                 <FormControlLabel 
                                    control={<Switch checked={participantVideo} onChange={e => setParticipantVideo(e.target.checked)} />}
                                    label={<Typography variant="body2">Participants video</Typography>}
                                 />
                                 <FormControlLabel 
                                    control={<Switch checked={muteUponEntry} onChange={e => setMuteUponEntry(e.target.checked)} />}
                                    label={<Typography variant="body2">Mute Participants upon entry</Typography>}
                                 />
                                  <FormControlLabel 
                                    control={<Switch checked={requireAuth} onChange={e => setRequireAuth(e.target.checked)} />}
                                    label={<Typography variant="body2">Require authentication to join: Sign in to Zoom</Typography>} 
                                 />
                             </Box>
                        </Stack>
                    )}

                    {/* --- Common Settings (Duration & Preview) - Only for Non-Zoom types or adjusted --- */}
                    {lessonType !== 'live_class' && (
                        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                             <TextField 
                                label="Lesson duration *" 
                                placeholder="Example: 2h 45m"
                                size="small"
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                onBlur={() => handleBlur('duration')}
                                sx={{ width: 250 }}
                                error={!!getFieldError('duration')}
                                helperText={getFieldError('duration')}
                                InputLabelProps={{ shrink: true, sx: { fontWeight: 500 } }}
                                required
                             />
                        </Box>
                    )}
                    
                    {/* Common Toggles */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                         <FormControlLabel 
                            control={<Switch checked={isPreview} onChange={e => setIsPreview(e.target.checked)} />}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2">Lesson preview</Typography>
                                    <Tooltip title="Enable this to allow non-enrolled users to preview this lesson for free" arrow>
                                        <InfoIcon fontSize="small" sx={{ ml: 1, color: 'primary.main', fontSize: 16, cursor: 'help' }} />
                                    </Tooltip>
                                </Box>
                            } 
                         />
                         <FormControlLabel 
                            control={<Switch checked={isLocked} onChange={e => setIsLocked(e.target.checked)} />}
                            label={<Typography variant="body2">Unlock the lesson after a certain time after the purchase</Typography>}
                         />
                    </Box>

                    {/* Date/Time Row for Non-Zoom (Zoom handles it in specific block) */}
                    {lessonType !== 'live_class' && (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                             <TextField 
                                label="Lesson start date" 
                                type="date"
                                fullWidth
                                size="small"
                                InputLabelProps={{ shrink: true, sx: { fontWeight: 500 } }}
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                sx={{ flex: 1 }}
                             />
                             <TextField 
                                label="Lesson start time" 
                                type="time"
                                fullWidth
                                size="small"
                                InputLabelProps={{ shrink: true, sx: { fontWeight: 500 } }}
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                sx={{ flex: 1 }}
                             />
                        </Box>
                    )}

                    {/* Rich Text Editor - Short Description */}
                    <Box sx={{ mt: 2 }} onBlur={() => handleBlur('description')}>
                        <Typography variant="body2" color={getFieldError('description') ? 'error' : 'text.secondary'} sx={{ mb: 1, fontWeight: 'bold' }}>
                            Short description of the lesson *
                        </Typography>
                        <RichTextEditor
                            value={description}
                            onChange={setDescription}
                            placeholder="Enter a brief description of the lesson (min 50 characters)..."
                            minHeight={100}
                        />
                        {getFieldError('description') && (
                            <FormHelperText error>{getFieldError('description')}</FormHelperText>
                        )}
                        <Typography variant="caption" color="text.secondary">
                            {description.replace(/<[^>]*>/g, '').length}/50 minimum characters
                        </Typography>
                    </Box>

                    {/* Rich Text Editor - Lesson Content */}
                    <Box sx={{ mt: 2 }} onBlur={() => handleBlur('content')}>
                        <Typography variant="body2" color={getFieldError('content') ? 'error' : 'text.secondary'} sx={{ mb: 1, fontWeight: 'bold' }}>
                            Lesson content *
                        </Typography>
                        <RichTextEditor
                            value={content}
                            onChange={setContent}
                            placeholder="Write your lesson content here (min 200 characters)..."
                            minHeight={250}
                        />
                        {getFieldError('content') && (
                            <FormHelperText error>{getFieldError('content')}</FormHelperText>
                        )}
                        <Typography variant="caption" color="text.secondary">
                            {content.replace(/<[^>]*>/g, '').length}/200 minimum characters
                        </Typography>
                    </Box>

                    {/* Lesson Materials */}
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Lesson materials</Typography>
                        <FileUploader
                            nodeId={node.id}
                            files={files}
                            onUploadComplete={(newFile) => setFiles([...files, newFile])}
                            onDeleteComplete={(fileId) => setFiles(files.filter(f => f.id !== fileId))}
                        />
                    </Box>
                    
                    {/* Gamification Settings - Only show when enabled */}
                    {featureFlags.gamification && (
                        <GamificationSettings
                            properties={{ gamification: gamificationSettings }}
                            onChange={(props) => setGamificationSettings(props.gamification)}
                        />
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
                        <Button variant="contained" onClick={handleSave} size="large" disabled={!isFormValid()}>{isNew ? 'Create' : 'Save'}</Button>
                    </Box>
                </Stack>
            )}
            
            {activeTab === 'qa' && (
                <QATab nodeId={node.id} />
            )}
            
            {/* Success/Error Snackbar */}
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={4000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

// Q&A Tab Component
function QATab({ nodeId }) {
    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [creating, setCreating] = useState(false);

    // Fetch discussions when component mounts
    useEffect(() => {
        fetchDiscussions();
    }, [nodeId]);

    const fetchDiscussions = async () => {
        setLoading(true);
        setError(null);
        try {
            // Use axios with automatic CSRF handling
            const response = await axios.get(`/instructor/nodes/${nodeId}/discussions/`);
            const data = response.data;
            if (data.error) {
                setError(data.error);
            } else {
                setDiscussions(data.discussions || []);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load discussions');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        setCreating(true);
        try {
            // Use axios with automatic CSRF handling
            const response = await axios.post(`/instructor/nodes/${nodeId}/discussions/create/`, {
                title: newTitle,
                content: newContent
            });
            const data = response.data;
            if (data.success) {
                setDiscussions([data.discussion, ...discussions]);
                setCreateOpen(false);
                setNewTitle('');
                setNewContent('');
            }
        } catch (err) {
            console.error('Failed to create discussion:', err);
        } finally {
            setCreating(false);
        }
    };

    const handleTogglePin = async (discussionId) => {
        try {
            // Use axios with automatic CSRF handling
            const response = await axios.post(`/instructor/discussions/${discussionId}/toggle-pin/`);
            const data = response.data;
            if (data.success) {
                setDiscussions(discussions.map(d => 
                    d.id === discussionId ? { ...d, is_pinned: data.is_pinned } : d
                ));
            }
        } catch (err) {
            console.error('Failed to toggle pin:', err);
        }
    };

    const handleToggleLock = async (discussionId) => {
        try {
            // Use axios with automatic CSRF handling
            const response = await axios.post(`/instructor/discussions/${discussionId}/toggle-lock/`);
            const data = response.data;
            if (data.success) {
                setDiscussions(discussions.map(d => 
                    d.id === discussionId ? { ...d, is_locked: data.is_locked } : d
                ));
            }
        } catch (err) {
            console.error('Failed to toggle lock:', err);
        }
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (loading) {
        return (
            <Box sx={{ py: 8, textAlign: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
                <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
            )}

            {/* Discussion List */}
            {discussions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                    <ChatIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                    <Typography>No discussions yet for this lesson.</Typography>
                    <Typography variant="body2">Start a discussion to engage with students.</Typography>
                </Box>
            ) : (
                <List disablePadding>
                    {discussions.map((d) => (
                        <ListItem 
                            key={d.id} 
                            divider
                            sx={{ 
                                bgcolor: d.is_pinned ? 'action.hover' : 'transparent',
                                borderRadius: 1,
                            }}
                        >
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {d.is_pinned && <PinIcon sx={{ fontSize: 16, color: 'warning.main' }} />}
                                        {d.is_locked && <LockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                                        <Typography variant="subtitle2">{d.title}</Typography>
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {d.author}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(d.created_at)}
                                        </Typography>
                                        <Chip 
                                            label={`${d.replies_count} replies`} 
                                            size="small" 
                                            variant="outlined"
                                            sx={{ height: 18, fontSize: '0.7rem' }}
                                        />
                                    </Box>
                                }
                            />
                            <ListItemSecondaryAction>
                                <Tooltip title={d.is_pinned ? 'Unpin' : 'Pin'}>
                                    <IconButton size="small" onClick={() => handleTogglePin(d.id)}>
                                        <PinIcon sx={{ fontSize: 18, color: d.is_pinned ? 'warning.main' : 'text.disabled' }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={d.is_locked ? 'Unlock' : 'Lock'}>
                                    <IconButton size="small" onClick={() => handleToggleLock(d.id)}>
                                        {d.is_locked ? 
                                            <LockIcon sx={{ fontSize: 18, color: 'text.secondary' }} /> : 
                                            <LockOpenIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                                        }
                                    </IconButton>
                                </Tooltip>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            )}

            {/* Create Discussion Dialog */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
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
                    <Button onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleCreate} 
                        disabled={!newTitle.trim() || creating}
                    >
                        {creating ? <CircularProgress size={20} /> : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
