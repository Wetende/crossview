/**
 * CourseDetailsModal - Unified context-aware modal (MasterStudy LMS design)
 * Shows course progress/completion AND review form in one modal
 * Switches between details view and review view
 */

import { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    Typography,
    Box,
    Stack,
    Button,
    IconButton,
    Rating,
    useTheme,
    Divider,
} from '@mui/material';
import { 
    IconCheck, 
    IconVideo, 
    IconFile, 
    IconX,
    IconBold,
    IconItalic,
    IconUnderline,
    IconStrikethrough,
    IconList,
    IconListNumbers,
    IconLink,
} from '@tabler/icons-react';
import { router } from '@inertiajs/react';

export default function CourseDetailsModal({
    open,
    onClose,
    program,
    enrollmentData,
    onViewCertificate,
}) {
    const theme = useTheme();
    const [view, setView] = useState('details'); // 'details' | 'review'
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const editorRef = useRef(null);

    const progressPercent = enrollmentData?.progressPercent || 0;
    const isCompleted = enrollmentData?.isCompleted || progressPercent >= 100;

    const handleClose = () => {
        setView('details');
        setRating(0);
        setReview('');
        onClose();
    };

    const handleSubmitReview = () => {
        if (rating === 0) return;
        
        setSubmitting(true);
        router.post(`/programs/${program.id}/review/`, {
            rating,
            review,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSubmitting(false);
                handleClose();
            },
            onError: () => {
                setSubmitting(false);
            },
        });
    };

    // Word count for review
    const wordCount = review.split(/\s+/).filter(Boolean).length;

    // Simple formatting functions
    const applyFormat = (format) => {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        document.execCommand(format, false, null);
        if (editorRef.current) {
            setReview(editorRef.current.innerHTML);
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, overflow: 'hidden' }
            }}
        >
            <IconButton
                onClick={handleClose}
                sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
            >
                <IconX size={20} />
            </IconButton>

            <DialogContent sx={{ p: 0 }}>
                {view === 'details' ? (
                    /* ========== DETAILS VIEW ========== */
                    <Stack direction={{ xs: 'column', sm: 'row' }}>
                        {/* Left content */}
                        <Box sx={{ flex: 1, p: 4, textAlign: 'center' }}>
                            {/* Score with check icon */}
                            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 1 }}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        bgcolor: isCompleted ? 'rgba(76, 175, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <IconCheck 
                                        size={24} 
                                        color={isCompleted ? theme.palette.success.main : theme.palette.primary.main} 
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                        Your score
                                    </Typography>
                                    <Typography 
                                        variant="h3" 
                                        fontWeight={700} 
                                        color={isCompleted ? 'success.main' : 'primary.main'}
                                    >
                                        {Math.round(progressPercent)}%
                                    </Typography>
                                </Box>
                            </Stack>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {isCompleted 
                                    ? 'You have successfully completed the course'
                                    : 'Keep going! You\'re making great progress'}
                            </Typography>
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                                {program?.name}
                            </Typography>

                            {/* Stats */}
                            <Stack spacing={1} sx={{ mb: 3 }}>
                                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                    <IconVideo size={18} color={theme.palette.primary.main} />
                                    <Typography variant="body2">
                                        Media: <strong>{enrollmentData?.completedNodes || 0}/{enrollmentData?.totalNodes || 0}</strong>
                                    </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                    <IconFile size={18} color={theme.palette.primary.main} />
                                    <Typography variant="body2">
                                        Pages: <strong>{enrollmentData?.completedNodes || 0}/{enrollmentData?.totalNodes || 0}</strong>
                                    </Typography>
                                </Stack>
                            </Stack>

                            {/* Action Buttons */}
                            <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap">
                                {isCompleted && onViewCertificate && (
                                    <Button
                                        variant="contained"
                                        onClick={onViewCertificate}
                                        sx={{ px: 2.5 }}
                                    >
                                        Certificate
                                    </Button>
                                )}
                                <Button
                                    variant={isCompleted ? "outlined" : "contained"}
                                    onClick={handleClose}
                                    sx={{ px: 2.5 }}
                                >
                                    Got It
                                </Button>
                                {isCompleted && (
                                    <Button
                                        variant="outlined"
                                        onClick={() => setView('review')}
                                        sx={{ px: 2.5 }}
                                    >
                                        Leave Review
                                    </Button>
                                )}
                            </Stack>
                        </Box>

                        {/* Right image (only on larger screens for completed courses) */}
                        {isCompleted && program?.thumbnail && (
                            <Box
                                sx={{
                                    width: { xs: '100%', sm: 200 },
                                    height: { xs: 150, sm: 'auto' },
                                    display: { xs: 'none', sm: 'block' },
                                }}
                            >
                                <Box
                                    component="img"
                                    src={program.thumbnail}
                                    alt={program.name}
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    }}
                                />
                            </Box>
                        )}
                    </Stack>
                ) : (
                    /* ========== REVIEW VIEW ========== */
                    <Box sx={{ p: 4 }}>
                        <Typography variant="h5" fontWeight={600} textAlign="center" sx={{ mb: 3 }}>
                            Leave your review
                        </Typography>

                        {/* Star Rating with blue background */}
                        <Box 
                            sx={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                mb: 3,
                                py: 1.5,
                                px: 2,
                                bgcolor: 'rgba(33, 150, 243, 0.1)',
                                borderRadius: 2,
                                width: 'fit-content',
                                mx: 'auto',
                            }}
                        >
                            <Rating
                                value={rating}
                                onChange={(e, newValue) => setRating(newValue)}
                                size="large"
                                sx={{
                                    '& .MuiRating-iconFilled': {
                                        color: theme.palette.warning.main,
                                    },
                                    '& .MuiRating-iconEmpty': {
                                        color: theme.palette.grey[300],
                                    },
                                    fontSize: '2rem',
                                }}
                            />
                        </Box>

                        {/* Rich Text Editor Toolbar */}
                        <Box 
                            sx={{ 
                                border: 1, 
                                borderColor: 'divider', 
                                borderRadius: 2,
                                overflow: 'hidden',
                            }}
                        >
                            <Stack 
                                direction="row" 
                                spacing={0.5} 
                                sx={{ 
                                    p: 1, 
                                    borderBottom: 1, 
                                    borderColor: 'divider',
                                    bgcolor: 'grey.50',
                                }}
                                alignItems="center"
                            >
                                <IconButton size="small" onClick={() => applyFormat('bold')}>
                                    <IconBold size={18} />
                                </IconButton>
                                <IconButton size="small" onClick={() => applyFormat('italic')}>
                                    <IconItalic size={18} />
                                </IconButton>
                                <IconButton size="small" onClick={() => applyFormat('underline')}>
                                    <IconUnderline size={18} />
                                </IconButton>
                                <IconButton size="small" onClick={() => applyFormat('strikethrough')}>
                                    <IconStrikethrough size={18} />
                                </IconButton>
                                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                                <IconButton size="small" onClick={() => applyFormat('insertUnorderedList')}>
                                    <IconList size={18} />
                                </IconButton>
                                <IconButton size="small" onClick={() => applyFormat('insertOrderedList')}>
                                    <IconListNumbers size={18} />
                                </IconButton>
                                <IconButton size="small">
                                    <IconLink size={18} />
                                </IconButton>
                                <Box sx={{ flex: 1 }} />
                                <Typography variant="caption" color="text.secondary">
                                    {wordCount} words
                                </Typography>
                            </Stack>

                            {/* Editable content area */}
                            <Box
                                ref={editorRef}
                                contentEditable
                                suppressContentEditableWarning
                                onInput={(e) => setReview(e.currentTarget.innerText)}
                                sx={{
                                    minHeight: 150,
                                    p: 2,
                                    outline: 'none',
                                    '&:empty:before': {
                                        content: '"Write your review here..."',
                                        color: 'text.disabled',
                                    },
                                }}
                            />
                        </Box>

                        {/* Action Buttons */}
                        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                            <Button
                                variant="outlined"
                                onClick={() => setView('details')}
                                sx={{ px: 4 }}
                            >
                                Back
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSubmitReview}
                                disabled={rating === 0 || submitting}
                                sx={{ px: 4 }}
                            >
                                {submitting ? 'Submitting...' : 'Submit Review'}
                            </Button>
                        </Stack>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
