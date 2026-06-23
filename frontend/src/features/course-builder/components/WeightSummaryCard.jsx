import {
    Card,
    CardContent,
    Typography,
    Box,
    LinearProgress,
    Stack,
    Chip,
    Alert
} from '@mui/material';
import { Assessment as AssessmentIcon } from '@mui/icons-material';

/**
 * WeightSummaryCard - Shows total weight distribution across assignments
 * Used in Course Builder to help instructors ensure weights sum to 100%
 */
export default function WeightSummaryCard({ assignments = [], quizzes = [] }) {
    // Calculate total weights
    const assignmentWeights = assignments.map(a => ({
        title: a.title || 'Untitled Assignment',
        weight: a.properties?.weight || 0,
        type: 'assignment'
    }));
    
    const quizWeights = quizzes.map(q => ({
        title: q.title || 'Untitled Quiz',
        weight: q.properties?.weight || 0,
        type: 'quiz'
    }));
    
    const allItems = [...assignmentWeights, ...quizWeights];
    const totalWeight = allItems.reduce((sum, item) => sum + item.weight, 0);
    const isValid = totalWeight === 100;
    const hasItems = allItems.length > 0;
    
    // Determine status
    let status = 'info';
    let statusMessage = '';
    
    if (!hasItems) {
        status = 'warning';
        statusMessage = 'No assessments added yet. Add assignments or quizzes.';
    } else if (totalWeight < 100) {
        status = 'warning';
        statusMessage = `${100 - totalWeight}% remaining to allocate`;
    } else if (totalWeight > 100) {
        status = 'error';
        statusMessage = `Exceeds 100% by ${totalWeight - 100}%`;
    } else {
        status = 'success';
        statusMessage = 'All weights properly distributed!';
    }

    return (
        <Card variant="outlined">
            <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <AssessmentIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={600}>
                        Assessment Weights
                    </Typography>
                </Stack>
                
                {/* Progress bar */}
                <Box sx={{ mb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                            Total Weight
                        </Typography>
                        <Typography 
                            variant="body2" 
                            fontWeight={600}
                            color={isValid ? 'success.main' : totalWeight > 100 ? 'error.main' : 'warning.main'}
                        >
                            {totalWeight}%
                        </Typography>
                    </Stack>
                    <LinearProgress 
                        variant="determinate" 
                        value={Math.min(totalWeight, 100)} 
                        color={isValid ? 'success' : totalWeight > 100 ? 'error' : 'warning'}
                        sx={{ height: 8, borderRadius: 1 }}
                    />
                </Box>
                
                {/* Status alert */}
                <Alert severity={status} sx={{ mb: 2 }}>
                    {statusMessage}
                </Alert>
                
                {/* Items breakdown */}
                {hasItems && (
                    <Stack spacing={1}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Breakdown
                        </Typography>
                        {allItems.map((item, idx) => (
                            <Stack 
                                key={idx} 
                                direction="row" 
                                justifyContent="space-between" 
                                alignItems="center"
                                sx={{ 
                                    py: 0.5, 
                                    px: 1, 
                                    bgcolor: 'action.hover', 
                                    borderRadius: 1 
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Chip 
                                        label={item.type === 'assignment' ? 'A' : 'Q'} 
                                        size="small" 
                                        color={item.type === 'assignment' ? 'primary' : 'secondary'}
                                        sx={{ width: 24, height: 24, fontSize: '0.7rem' }}
                                    />
                                    <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                                        {item.title}
                                    </Typography>
                                </Stack>
                                <Typography variant="body2" fontWeight={500}>
                                    {item.weight}%
                                </Typography>
                            </Stack>
                        ))}
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
}
