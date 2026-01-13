import React, { useState } from 'react';
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
    Chip, 
    Divider 
} from '@mui/material';
import {
    Add as AddIcon,
    Article as ArticleIcon,
    OndemandVideo as VideoIcon,
    VideoCameraFront as ZoomIcon,
    Quiz as QuizIcon,
    Assignment as AssignmentIcon,
    Visibility as VisibilityIcon,
    Undo as UndoIcon, 
    Redo as RedoIcon,
    FormatBold,
    FormatItalic,
    FormatUnderlined,
    StrikethroughS,
    FormatAlignLeft,
    FormatAlignCenter, 
    FormatAlignRight,
    FormatListBulleted,
    FormatListNumbered,
    InsertLink,
    InsertPhoto,
    Movie as MovieIcon,
    Code as CodeIcon
} from '@mui/icons-material';

export default function NodeEditor({ node, onSave }) {
    const [title, setTitle] = useState(node.title);
    const [activeTab, setActiveTab] = useState(node.properties?.lesson_type === 'quiz' ? 'questions' : 'lesson'); // Default tab based on type
    const [description, setDescription] = useState(node.description || ''); // Rich text content placeholder
    const [content, setContent] = useState(node.properties?.content || ''); // Main lesson content
    const [duration, setDuration] = useState(node.properties?.duration || '');
    const [isPreview, setIsPreview] = useState(node.properties?.is_preview || false);
    const [isLocked, setIsLocked] = useState(false); // Example logical state
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    
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

    // Quiz Specific State
    const [quizDuration, setQuizDuration] = useState(node.properties?.quiz_duration || '2');
    const [quizTimeUnit, setQuizTimeUnit] = useState(node.properties?.quiz_time_unit || 'Hours');
    const [quizStyle, setQuizStyle] = useState(node.properties?.quiz_style || 'Global');
    const [passingGrade, setPassingGrade] = useState(node.properties?.passing_grade || '80');
    const [pointsCut, setPointsCut] = useState(node.properties?.points_cut || '0');
    const [randomizeQuestions, setRandomizeQuestions] = useState(node.properties?.randomize_questions || false);
    const [randomizeAnswers, setRandomizeAnswers] = useState(node.properties?.randomize_answers || false);
    const [showCorrectAnswer, setShowCorrectAnswer] = useState(node.properties?.show_correct_answer || false);
    const [quizAttemptHistory, setQuizAttemptHistory] = useState(node.properties?.quiz_attempt_history || false);
    const [retakeAfterPass, setRetakeAfterPass] = useState(node.properties?.retake_after_pass || false);
    const [limitedAttempts, setLimitedAttempts] = useState(node.properties?.limited_attempts || false);
    
    // Quiz Questions State (Mock)
    const [newQuestionText, setNewQuestionText] = useState('');
    const [showNewQuestionInput, setShowNewQuestionInput] = useState(false);
    const [questions, setQuestions] = useState(node.properties?.questions || [
        { id: 1, text: 'The most famous personalities in IT?', type: 'MATCHING' },
        { id: 2, text: 'Which of the indicated programming languages can create mobile sentences', type: 'MULTIPLE CHOICE' },
        { id: 3, text: 'Is 380MBps transfer rate of a standard USB 2.0 Device?', type: 'TRUE-FALSE' },
    ]);

    const lessonType = node.properties?.lesson_type || 'text';

    const handleSave = () => {
        onSave(node.id, {
            title,
            description, // For quiz this is "Short description"
            properties: { 
                ...node.properties,
                content, // Added main content
                duration,
                is_preview: isPreview,
                start_date: startDate,
                start_time: startTime,
                // Video properties
                video_source: videoSource,
                video_url: videoUrl,
                // Live Class properties
                meeting_password: meetingPassword,
                timezone,
                allow_join_anytime: allowJoinAnytime,
                host_video: hostVideo,
                participant_video: participantVideo,
                mute_upon_entry: muteUponEntry,
                require_auth: requireAuth,
                // Quiz propertes
                quiz_duration: quizDuration,
                quiz_time_unit: quizTimeUnit,
                quiz_style: quizStyle,
                passing_grade: passingGrade,
                points_cut: pointsCut,
                randomize_questions: randomizeQuestions,
                randomize_answers: randomizeAnswers,
                show_correct_answer: showCorrectAnswer,
                quiz_attempt_history: quizAttemptHistory,
                retake_after_pass: retakeAfterPass,
                limited_attempts: limitedAttempts,
                questions: questions,
            }
        });
    };
    
    // Determine icon and label based on type
    const getHeaderInfo = () => {
        switch (lessonType) {
            case 'video': return { icon: <VideoIcon />, label: 'Video lesson' };
            case 'live_class': return { icon: <ZoomIcon />, label: 'Live class' }; 
            case 'quiz': return { icon: <QuizIcon />, label: 'Quiz' };
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
                   placeholder={lessonType === 'quiz' ? "Enter quiz name" : "Enter lesson name"} 
                   value={title} 
                   onChange={e => setTitle(e.target.value)}
                   fullWidth
                   InputProps={{ sx: { fontSize: '1.2rem', fontWeight: 500 } }}
               />
               <Button variant="contained" onClick={handleSave} size="medium" sx={{ ml: 2 }}>{lessonType === 'quiz' ? 'Save' : 'Create'}</Button>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                    {lessonType === 'quiz' ? [
                         <Tab key="questions" label={<Box sx={{display:'flex', alignItems:'center'}}>Questions <Chip label={questions.length} size="small" sx={{ml:1, height: 20, fontSize: '0.7rem'}} /></Box>} value="questions" sx={{ textTransform: 'none', minWidth: 100 }} />,
                         <Tab key="settings" label="Settings" value="settings" sx={{ textTransform: 'none', minWidth: 100 }} />,
                         <Tab key="qa" label="Q&A" value="qa" sx={{ textTransform: 'none', minWidth: 100 }} />
                    ] : [
                        <Tab key="lesson" label="Lesson" value="lesson" sx={{ textTransform: 'none', minWidth: 100 }} />,
                        <Tab key="qa" label="Q&A" value="qa" sx={{ textTransform: 'none', minWidth: 100 }} />
                    ]}
                </Tabs>
            </Box>

            {activeTab === 'lesson' && lessonType !== 'quiz' && (
                <Stack spacing={3}>
                    
                    {/* --- Video Lesson Specifics --- */}
                    {lessonType === 'video' && (
                        <Box>
                            <InputLabel shrink sx={{ mb: 1, fontWeight: 500 }}>Source type</InputLabel>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={videoSource}
                                    onChange={e => setVideoSource(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="" disabled>Select source</MenuItem>
                                    <MenuItem value="html5">HTML5 (MP4)</MenuItem>
                                    <MenuItem value="youtube">YouTube</MenuItem>
                                    <MenuItem value="vimeo">Vimeo</MenuItem>
                                    <MenuItem value="external">External Link</MenuItem>
                                </Select>
                            </FormControl>
                            {videoSource && (
                                <TextField 
                                    sx={{ mt: 2 }}
                                    label="Video URL" 
                                    fullWidth 
                                    size="small"
                                    value={videoUrl} 
                                    onChange={e => setVideoUrl(e.target.value)} 
                                />
                            )}
                        </Box>
                    )}

                    {/* --- Live Class (Zoom) Specifics --- */}
                    {lessonType === 'live_class' && (
                        <Stack spacing={2}>
                             <TextField 
                                label="Meeting password" 
                                placeholder="Enter password"
                                fullWidth
                                size="small"
                                value={meetingPassword}
                                onChange={e => setMeetingPassword(e.target.value)}
                                InputLabelProps={{ shrink: true, sx: { fontWeight: 500 } }}
                             />
                             
                             <Box sx={{ display: 'flex', gap: 2 }}>
                                 <TextField 
                                    label="Select start date" 
                                    type="date"
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true, sx: { fontWeight: 500 } }}
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                 />
                                 <TextField 
                                    label="Select start time" 
                                    type="time"
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true, sx: { fontWeight: 500 } }}
                                    value={startTime}
                                    onChange={e => setStartTime(e.target.value)}
                                 />
                             </Box>

                             <TextField 
                                label="Lesson duration" 
                                placeholder="Example: 2h 45m"
                                fullWidth
                                size="small"
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                InputLabelProps={{ shrink: true, sx: { fontWeight: 500 } }}
                             />
                             
                             <FormControl fullWidth size="small">
                                <InputLabel shrink sx={{ fontWeight: 500 }}>Timezone</InputLabel>
                                <Select
                                    value={timezone}
                                    onChange={e => setTimezone(e.target.value)}
                                    label="Timezone"
                                    displayEmpty
                                >
                                    <MenuItem value="" disabled>Select timezone</MenuItem>
                                    <MenuItem value="UTC">UTC</MenuItem>
                                    <MenuItem value="PST">PST</MenuItem>
                                    <MenuItem value="EST">EST</MenuItem>
                                    {/* Add more timezones as needed */}
                                </Select>
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
                                label="Lesson duration" 
                                placeholder="Example: 2h 45m"
                                size="small"
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                sx={{ width: 250 }}
                                InputLabelProps={{ shrink: true, sx: { fontWeight: 500 } }}
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
                                    <VisibilityIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary', fontSize: 16 }} />
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

                    {/* Rich Text Editor Placeholder - Common */}
                    {/* Rich Text Editor - Short Description */}
                     <Box sx={{ mt: 2 }}>
                         <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>Short description of the lesson</Typography>
                        <Paper variant="outlined" sx={{ minHeight: 150, bgcolor: '#fff', borderRadius: 1, overflow: 'hidden' }}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 1, bgcolor: '#f8f9fa', display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ cursor: 'pointer' }}>View</Typography>
                                <Typography variant="caption" sx={{ cursor: 'pointer' }}>Format</Typography>
                                <Typography variant="caption" sx={{ cursor: 'pointer' }}>Table</Typography>
                                <Typography variant="caption" sx={{ cursor: 'pointer' }}>Tools</Typography>
                            </Box>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 1, bgcolor: '#fff', display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                <FormatBold fontSize="small" sx={{ cursor: 'pointer', color: 'text.secondary' }} />
                                <FormatItalic fontSize="small" sx={{ cursor: 'pointer', color: 'text.secondary' }} />
                                <FormatUnderlined fontSize="small" sx={{ cursor: 'pointer', color: 'text.secondary' }} />
                                <Divider orientation="vertical" flexItem sx={{ height: 20 }} />
                                <Typography variant="body2" sx={{ cursor: 'pointer', fontSize: '0.875rem' }}>Paragraph</Typography>
                            </Box>
                            <TextField
                                multiline
                                fullWidth
                                minRows={4}
                                placeholder="..."
                                variant="standard"
                                InputProps={{ disableUnderline: true, sx: { p: 2 } }}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </Paper>
                    </Box>

                    {/* Rich Text Editor - Lesson Content */}
                     <Box sx={{ mt: 2 }}>
                         <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>Lesson content</Typography>
                        <Paper variant="outlined" sx={{ minHeight: 300, bgcolor: '#fff', borderRadius: 1, overflow: 'hidden' }}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 1, bgcolor: '#f8f9fa', display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ cursor: 'pointer' }}>View</Typography>
                                <Typography variant="caption" sx={{ cursor: 'pointer' }}>Format</Typography>
                                <Typography variant="caption" sx={{ cursor: 'pointer' }}>Table</Typography>
                                <Typography variant="caption" sx={{ cursor: 'pointer' }}>Tools</Typography>
                            </Box>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 1, bgcolor: '#fff', display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', color: 'text.secondary' }}>
                                <UndoIcon fontSize="small" sx={{ cursor: 'pointer' }} />
                                <RedoIcon fontSize="small" sx={{ cursor: 'pointer' }} />
                                <Divider orientation="vertical" flexItem sx={{ height: 20 }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f0f0f0', px: 1, py: 0.5, borderRadius: 1, cursor: 'pointer' }}>
                                    <Typography variant="caption" sx={{ mr: 1 }}>Paragraph</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mx: 1 }}>
                                    <Typography variant="caption">System Font</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mx: 1 }}>
                                    <Typography variant="caption">16px</Typography>
                                </Box>
                                <Divider orientation="vertical" flexItem sx={{ height: 20 }} />
                                <FormatBold fontSize="small" sx={{ cursor: 'pointer' }} />
                                <FormatItalic fontSize="small" sx={{ cursor: 'pointer' }} />
                                <FormatUnderlined fontSize="small" sx={{ cursor: 'pointer' }} />
                                <StrikethroughS fontSize="small" sx={{ cursor: 'pointer' }} />
                                <Divider orientation="vertical" flexItem sx={{ height: 20 }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', borderBottom: '2px solid black' }}>A</Typography>
                                </Box>
                                <Divider orientation="vertical" flexItem sx={{ height: 20 }} />
                                <FormatAlignLeft fontSize="small" sx={{ cursor: 'pointer' }} />
                                <FormatAlignCenter fontSize="small" sx={{ cursor: 'pointer' }} />
                                <FormatAlignRight fontSize="small" sx={{ cursor: 'pointer' }} />
                                <Divider orientation="vertical" flexItem sx={{ height: 20 }} />
                                <FormatListBulleted fontSize="small" sx={{ cursor: 'pointer' }} />
                                <FormatListNumbered fontSize="small" sx={{ cursor: 'pointer' }} />
                                <Divider orientation="vertical" flexItem sx={{ height: 20 }} />
                                <InsertLink fontSize="small" sx={{ cursor: 'pointer' }} />
                                <InsertPhoto fontSize="small" sx={{ cursor: 'pointer' }} />
                                <MovieIcon fontSize="small" sx={{ cursor: 'pointer' }} />
                                <CodeIcon fontSize="small" sx={{ cursor: 'pointer' }} />
                            </Box>
                            <TextField
                                multiline
                                fullWidth
                                minRows={12}
                                placeholder=""
                                variant="standard"
                                InputProps={{ disableUnderline: true, sx: { p: 2 } }}
                                value={content}
                                onChange={e => setContent(e.target.value)}
                            />
                        </Paper>
                    </Box>

                    {/* Lesson Materials */}
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Lesson materials</Typography>
                        <Paper variant="outlined" sx={{ 
                            p: 4, 
                            borderStyle: 'dashed', 
                            borderColor: 'divider', 
                            bgcolor: '#f8f9fa',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: '#f0f0f0' }
                        }}>
                             <Typography variant="body2" color="text.secondary" gutterBottom>
                                Drag & drop files here or browse files from your computer
                             </Typography>
                             <Button variant="contained" size="small" sx={{ mt: 1, textTransform: 'none' }}>
                                 Browse files
                             </Button>
                        </Paper>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
                        <Button variant="contained" onClick={handleSave} size="large">Create</Button>
                    </Box>
                </Stack>
            )}
            
            {/* --- Quiz Editor Tabs --- */}
            {activeTab === 'questions' && lessonType === 'quiz' && (
                <Box>
                     <Stack spacing={2}>
                        {questions.map((q) => (
                            <Paper key={q.id} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor:'#fbfbfb' }}>
                                <Typography sx={{flex:1}}>{q.text}</Typography>
                                <Chip label={q.type} size="small" sx={{ borderRadius: 1, bgcolor: '#8e9aaf', color: '#fff', fontWeight: 600, fontSize:'0.7rem' }} />
                            </Paper>
                        ))}
                     </Stack>

                     {showNewQuestionInput ? (
                         <Box sx={{ mt: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                             <Typography variant="subtitle2" sx={{ mb: 1 }}>New question</Typography>
                             <TextField 
                                multiline 
                                rows={3} 
                                fullWidth 
                                placeholder="Enter question" 
                                value={newQuestionText}
                                onChange={e => setNewQuestionText(e.target.value)}
                                sx={{ mb: 2, bgcolor: '#fff' }}
                             />
                             <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button variant="contained" onClick={() => {
                                    setQuestions([...questions, { id: Date.now(), text: newQuestionText, type: 'MULTIPLE CHOICE' }]);
                                    setNewQuestionText('');
                                    setShowNewQuestionInput(false);
                                }}>Submit</Button>
                                <Button onClick={() => setShowNewQuestionInput(false)}>Cancel</Button>
                             </Box>
                         </Box>
                     ) : (
                         <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
                             <Button variant="contained" onClick={() => setShowNewQuestionInput(true)} startIcon={<AddIcon />}>Question</Button>
                             <Button variant="contained" color="success" startIcon={<AddIcon />}>Question Bank</Button>
                         </Box>
                     )}
                </Box>
            )}

            {activeTab === 'settings' && lessonType === 'quiz' && (
                <Stack spacing={3}>
                    <Box>
                         <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>Short description of the quiz</Typography>
                         <TextField 
                            multiline
                            rows={3}
                            fullWidth
                            placeholder="Quiz description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                         />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <InputLabel shrink sx={{ fontWeight: 600 }}>Quiz duration</InputLabel>
                            <TextField 
                                fullWidth size="small" 
                                type="number" 
                                value={quizDuration} 
                                onChange={e => setQuizDuration(e.target.value)} 
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <InputLabel shrink sx={{ fontWeight: 600 }}>Time unit</InputLabel>
                             <Select fullWidth size="small" value={quizTimeUnit} onChange={e => setQuizTimeUnit(e.target.value)}>
                                 <MenuItem value="Minutes">Minutes</MenuItem>
                                 <MenuItem value="Hours">Hours</MenuItem>
                                 <MenuItem value="Days">Days</MenuItem>
                             </Select>
                        </Box>
                    </Box>

                    <Box>
                         <InputLabel shrink sx={{ fontWeight: 600 }}>Quiz style</InputLabel>
                         <Select fullWidth size="small" value={quizStyle} onChange={e => setQuizStyle(e.target.value)}>
                             <MenuItem value="Global">Global</MenuItem>
                             <MenuItem value="Specific">Specific</MenuItem>
                         </Select>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <FormControlLabel control={<Switch checked={randomizeQuestions} onChange={e => setRandomizeQuestions(e.target.checked)} />} label="Randomize questions" />
                        <FormControlLabel control={<Switch checked={randomizeAnswers} onChange={e => setRandomizeAnswers(e.target.checked)} />} label="Randomize answers" />
                        
                        <FormControlLabel control={<Switch checked={showCorrectAnswer} onChange={e => setShowCorrectAnswer(e.target.checked)} />} label="Show correct answer" />
                        <FormControlLabel control={<Switch checked={quizAttemptHistory} onChange={e => setQuizAttemptHistory(e.target.checked)} />} label="Quiz Attempt History" />
                        
                        <FormControlLabel control={<Switch checked={retakeAfterPass} onChange={e => setRetakeAfterPass(e.target.checked)} />} label="Retake After Pass" />
                        <FormControlLabel control={<Switch checked={limitedAttempts} onChange={e => setLimitedAttempts(e.target.checked)} />} label="Limited attempts to retake quizzes" />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <InputLabel shrink sx={{ fontWeight: 600 }}>Passing grade (%)</InputLabel>
                            <TextField 
                                fullWidth size="small" 
                                type="number" 
                                value={passingGrade} 
                                onChange={e => setPassingGrade(e.target.value)} 
                            />
                        </Box>
                         <Box sx={{ flex: 1 }}>
                            <InputLabel shrink sx={{ fontWeight: 600 }}>Points cut after retake (%)</InputLabel>
                            <TextField 
                                fullWidth size="small" 
                                type="number" 
                                placeholder="Enter points cut after retake"
                                value={pointsCut} 
                                onChange={e => setPointsCut(e.target.value)} 
                            />
                        </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
                        <Button variant="contained" onClick={handleSave} size="large">Save</Button>
                    </Box>
                </Stack>
            )}

            
            {activeTab === 'qa' && (
                <Box py={8} textAlign="center" color="text.secondary">
                    <Typography>Q&A settings and threads will appear here.</Typography>
                </Box>
            )}
        </Box>
    );
}
