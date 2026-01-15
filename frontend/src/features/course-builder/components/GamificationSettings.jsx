import React from 'react';
import { 
    Paper, 
    Typography, 
    TextField, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem,
    Box
} from '@mui/material';
import { EmojiEvents as TrophyIcon } from '@mui/icons-material';

/**
 * GamificationSettings - Configure XP and badge settings for a lesson
 * Only visible when blueprint.featureFlags.gamification is true (Online/Self-paced mode)
 */
export default function GamificationSettings({ properties, onChange }) {
    const gamification = properties?.gamification || {};
    
    const handleChange = (field, value) => {
        const updatedGamification = { ...gamification, [field]: value };
        onChange({
            ...properties,
            gamification: updatedGamification
        });
    };
    
    return (
        <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrophyIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="subtitle2" fontWeight="bold">
                    Gamification Settings
                </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {/* XP Reward */}
                <TextField
                    label="XP Reward"
                    type="number"
                    value={gamification.xp_reward || 0}
                    onChange={(e) => handleChange('xp_reward', parseInt(e.target.value) || 0)}
                    size="small"
                    sx={{ width: 120 }}
                    inputProps={{ min: 0, max: 1000 }}
                    helperText="Points for completion"
                />
                
                {/* Badge Trigger */}
                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Award Badge On</InputLabel>
                    <Select
                        value={gamification.badge_trigger || ''}
                        onChange={(e) => handleChange('badge_trigger', e.target.value)}
                        label="Award Badge On"
                    >
                        <MenuItem value="">None</MenuItem>
                        <MenuItem value="lesson_complete">Lesson Complete</MenuItem>
                        <MenuItem value="quiz_pass">Quiz Pass</MenuItem>
                        <MenuItem value="quiz_perfect">Perfect Quiz Score</MenuItem>
                        <MenuItem value="first_try_pass">First Try Pass</MenuItem>
                    </Select>
                </FormControl>
                
                {/* Bonus XP Condition */}
                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Bonus XP Condition</InputLabel>
                    <Select
                        value={gamification.bonus_xp_condition || ''}
                        onChange={(e) => handleChange('bonus_xp_condition', e.target.value)}
                        label="Bonus XP Condition"
                    >
                        <MenuItem value="">None</MenuItem>
                        <MenuItem value="first_try_pass">First Try Pass</MenuItem>
                        <MenuItem value="under_time">Completed Under Time</MenuItem>
                        <MenuItem value="streak">Learning Streak Active</MenuItem>
                    </Select>
                </FormControl>
                
                {/* Bonus XP Amount */}
                {gamification.bonus_xp_condition && (
                    <TextField
                        label="Bonus XP"
                        type="number"
                        value={gamification.bonus_xp_amount || 0}
                        onChange={(e) => handleChange('bonus_xp_amount', parseInt(e.target.value) || 0)}
                        size="small"
                        sx={{ width: 100 }}
                        inputProps={{ min: 0, max: 500 }}
                    />
                )}
            </Box>
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                These settings only apply when the course is in Online/Self-paced mode with gamification enabled.
            </Typography>
        </Paper>
    );
}
