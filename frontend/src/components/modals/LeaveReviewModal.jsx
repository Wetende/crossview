/**
 * LeaveReviewModal - Star rating + review input modal
 * Allows students to rate and review completed courses
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    Typography,
    Box,
    Stack,
    Button,
    Rating,
    TextField,
    IconButton,
    useTheme,
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { router } from '@inertiajs/react';

export default function LeaveReviewModal({
    open,
    onClose,
    onBack,
    programId,
    programName,
}) {
    const theme = useTheme();
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = () => {
        if (rating === 0) return;
        
        setSubmitting(true);
        
        // Submit review via Inertia
        router.post(`/programs/${programId}/review/`, {
            rating,
            review,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSubmitting(false);
                onClose();
            },
            onError: () => {
                setSubmitting(false);
            },
        });
    };

    const handleClose = () => {
        setRating(0);
        setReview('');
        onClose();
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
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mb: 3 }}>
                    {review.split(/\s+/).filter(Boolean).length} words
                </Typography>

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} justifyContent="center">
                    <Button
                        variant="outlined"
                        onClick={onBack || handleClose}
                        sx={{ px: 4 }}
                    >
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={rating === 0 || submitting}
                        sx={{ 
                            bgcolor: theme.palette.primary.main,
                            px: 4,
                        }}
                    >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
