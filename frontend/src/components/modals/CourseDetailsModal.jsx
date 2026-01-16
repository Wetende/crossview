/**
 * CourseDetailsModal - Unified context-aware modal
 * Shows course progress/completion AND review form in one modal
 * Switches between details view and review view
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    Typography,
    Box,
    Stack,
    Button,
    IconButton,
    Rating,
    TextField,
    useTheme,
} from '@mui/material';
import { IconCheck, IconVideo, IconFile, IconX, IconArrowLeft } from '@tabler/icons-react';
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

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, p: 1 }
            }}
        >
            <IconButton
                onClick={handleClose}
                sx={{ position: 'absolute', top: 8, right: 8 }}
            >
                <IconX size={20} />
            </IconButton>

            <DialogContent sx={{ py: 4 }}>
                {view === 'details' ? (
                    /* ========== DETAILS VIEW ========== */
                    <Box sx={{ textAlign: 'center' }}>
                        {/* Score Circle */}
                        <Box
                            sx={{
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                bgcolor: isCompleted ? 'rgba(76, 175, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2,
                            }}
                        >
                            <IconCheck 
                                size={40} 
                                color={isCompleted ? theme.palette.success.main : theme.palette.primary.main} 
                            />
                        </Box>

                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Your score
                        </Typography>
                        <Typography 
                            variant="h2" 
                            fontWeight={700} 
                            color={isCompleted ? 'success.main' : 'primary.main'}
                        >
                            {Math.round(progressPercent)}%
                        </Typography>

                        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                            {isCompleted 
                                ? 'You have successfully completed the course'
                                : 'Keep going! You\'re making great progress'}
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                            {program?.name}
                        </Typography>

                        {/* Stats */}
                        <Stack spacing={1.5} sx={{ mt: 3, mb: 4 }}>
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                <IconVideo size={18} color={theme.palette.text.secondary} />
                                <Typography variant="body2" color="text.secondary">
                                    Media: <strong>{enrollmentData?.completedNodes || 0}/{enrollmentData?.totalNodes || 0}</strong>
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                <IconFile size={18} color={theme.palette.text.secondary} />
                                <Typography variant="body2" color="text.secondary">
                                    Pages: <strong>{enrollmentData?.completedNodes || 0}/{enrollmentData?.totalNodes || 0}</strong>
                                </Typography>
                            </Stack>
                        </Stack>

                        {/* Action Buttons */}
                        <Stack direction="row" spacing={2} justifyContent="center">
                            {isCompleted && onViewCertificate && (
                                <Button
                                    variant="contained"
                                    onClick={onViewCertificate}
                                    sx={{ px: 3 }}
                                >
                                    Certificate
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                onClick={handleClose}
                                sx={{ px: 3 }}
                            >
                                Got It
                            </Button>
                            {isCompleted && (
                                <Button
                                    variant="outlined"
                                    onClick={() => setView('review')}
                                    sx={{ px: 3 }}
                                >
                                    Leave Review
                                </Button>
                            )}
                        </Stack>
                    </Box>
                ) : (
                    /* ========== REVIEW VIEW ========== */
                    <Box>
                        {/* Back button */}
                        <IconButton 
                            onClick={() => setView('details')} 
                            sx={{ position: 'absolute', top: 8, left: 8 }}
                        >
                            <IconArrowLeft size={20} />
                        </IconButton>

                        <Typography variant="h5" fontWeight={600} textAlign="center" sx={{ mb: 3 }}>
                            Leave your review
                        </Typography>

                        {/* Star Rating */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                            <Rating
                                value={rating}
                                onChange={(e, newValue) => setRating(newValue)}
                                size="large"
                                sx={{
                                    '& .MuiRating-iconFilled': {
                                        color: theme.palette.warning.main,
                                    },
                                    fontSize: '2.5rem',
                                }}
                            />
                        </Box>

                        {/* Review Text */}
                        <TextField
                            multiline
                            rows={6}
                            fullWidth
                            placeholder="Write your review here..."
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            sx={{
                                mb: 1,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                },
                            }}
                        />
                        <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ display: 'block', textAlign: 'right', mb: 3 }}
                        >
                            {review.split(/\s+/).filter(Boolean).length} words
                        </Typography>

                        {/* Action Buttons */}
                        <Stack direction="row" spacing={2} justifyContent="center">
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
