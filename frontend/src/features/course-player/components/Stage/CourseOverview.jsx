import { Link } from '@inertiajs/react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Stack,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Alert,
} from '@mui/material';
import {
    PlayArrow as StartIcon,
    Description as DocIcon,
    CheckCircle as CheckIcon,
    MenuBook as BookIcon,
    Download as DownloadIcon,
    Notifications as NoticeIcon,
} from '@mui/icons-material';
import DOMPurify from 'dompurify';

export default function CourseOverview({
    program,
    enrollment,
    curriculumSummary,
    resumeUrl,
}) {
    const hasStarted = (enrollment?.progressPercent || 0) > 0;
    const hasNotices = program?.notices?.length > 0;
    const hasWhatYouLearn = program?.whatYouLearnHtml || program?.whatYouLearnItems?.length > 0;
    const hasResources = program?.resources?.length > 0;
    const hasCurriculum = curriculumSummary?.lessonCount > 0;
    const getNoticeTitle = (notice, index) => {
        if (typeof notice === 'string') return null;
        return notice?.title || `Notice ${index + 1}`;
    };
    const getNoticeContent = (notice) => {
        if (typeof notice === 'string') return notice;
        return notice?.content || notice?.text || notice?.message || '';
    };

    return (
        <Box sx={{ maxWidth: 720, mx: 'auto' }}>
            {/* Hero Section */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={800} gutterBottom>
                    {program?.name || 'Course'}
                </Typography>
                {program?.description && (
                    <Box
                        sx={{ maxWidth: 560, mx: 'auto', mb: 3, '& p': { mb: 1 }, color: 'text.secondary' }}
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(program.description),
                        }}
                    />
                )}

                <Button
                    component={Link}
                    href={resumeUrl || '#'}
                    variant="contained"
                    size="large"
                    startIcon={<StartIcon />}
                    sx={{
                        px: 4,
                        py: 1.5,
                        fontWeight: 700,
                        borderRadius: 2,
                        fontSize: '1rem',
                    }}
                >
                    {hasStarted ? 'Resume Learning' : 'Start Learning'}
                </Button>

                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    {hasStarted
                        ? `${Math.round(enrollment?.progressPercent || 0)}% complete`
                        : 'Begin your learning journey'}
                </Typography>
            </Box>

            {/* Notices */}
            {hasNotices && (
                <Box sx={{ mb: 4 }}>
                    {program.notices.map((notice, idx) => (
                        <Alert
                            key={idx}
                            severity={notice.type === 'warning' ? 'warning' : 'info'}
                            icon={<NoticeIcon />}
                            sx={{ mb: 1, borderRadius: 2 }}
                        >
                            {getNoticeTitle(notice, idx) && (
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                                    {getNoticeTitle(notice, idx)}
                                </Typography>
                            )}
                            <Box
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(getNoticeContent(notice)),
                                }}
                            />
                        </Alert>
                    ))}
                </Box>
            )}

            {/* What You'll Learn */}
            {hasWhatYouLearn && (
                <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                            <CheckIcon color="success" fontSize="small" />
                            <Typography variant="h6" fontWeight={700}>
                                What You&rsquo;ll Learn
                            </Typography>
                        </Stack>
                        {program.whatYouLearnHtml ? (
                            <Box
                                sx={{
                                    '& ul, & ol': { pl: 3, mb: 1 },
                                    '& li': { mb: 0.5, color: 'text.secondary' },
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(program.whatYouLearnHtml),
                                }}
                            />
                        ) : (
                            <List dense disablePadding>
                                {program.whatYouLearnItems.map((item, idx) => (
                                    <ListItem key={idx} disableGutters sx={{ py: 0.25 }}>
                                        <ListItemIcon sx={{ minWidth: 28 }}>
                                            <CheckIcon color="success" fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* How This Course Is Organized */}
            {hasCurriculum && (
                <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                            <BookIcon color="primary" fontSize="small" />
                            <Typography variant="h6" fontWeight={700}>
                                How This Course Is Organized
                            </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {curriculumSummary.sectionCount} section{curriculumSummary.sectionCount !== 1 ? 's' : ''}
                            {' \u2022 '}
                            {curriculumSummary.lessonCount} lesson{curriculumSummary.lessonCount !== 1 ? 's' : ''}
                        </Typography>
                        {curriculumSummary.sections.map((section, idx) => (
                            <Box
                                key={idx}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    py: 1,
                                    px: 2,
                                    bgcolor: 'action.hover',
                                    borderRadius: 1,
                                    mb: 1,
                                }}
                            >
                                <Typography variant="body2" fontWeight={500}>
                                    {section.title}
                                </Typography>
                                <Chip
                                    label={`${section.lessonCount} lesson${section.lessonCount !== 1 ? 's' : ''}`}
                                    size="small"
                                    variant="outlined"
                                />
                            </Box>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Course Resources */}
            {hasResources && (
                <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                            <DownloadIcon color="info" fontSize="small" />
                            <Typography variant="h6" fontWeight={700}>
                                Course Resources
                            </Typography>
                        </Stack>
                        <List dense disablePadding>
                            {program.resources.map((res) => (
                                <ListItem
                                    key={res.id}
                                    disableGutters
                                    sx={{ py: 0.5 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 28 }}>
                                        <DocIcon fontSize="small" color="action" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={res.title || `Resource ${res.id}`}
                                        primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                    <Button
                                        component="a"
                                        href={res.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="small"
                                        variant="outlined"
                                        sx={{ minWidth: 'auto', textTransform: 'none' }}
                                    >
                                        Download
                                    </Button>
                                </ListItem>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}
