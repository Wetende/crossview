import { Box, Typography } from '@mui/material';
import { getActivitySummary } from '@/lib/activityTypes';

const LessonHeader = ({ node }) => {
    if (!node) return null;

    return (
        <Box sx={{ mb: 3 }}>
            {/* Eyebrow: activity type and detail */}
            <Typography
                variant="overline"
                component="p"
                color="textSecondary"
                sx={{ display: 'block', lineHeight: 1.6, mb: 0.5 }}
            >
                {getActivitySummary(node)}
            </Typography>

            {/* Lesson Title */}
            <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: 700, lineHeight: 1.25 }}
            >
                {node.title}
            </Typography>
        </Box>
    );
};

export default LessonHeader;
