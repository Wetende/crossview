import React, { useState } from 'react';
import { 
    Box, 
    Typography, 
    Switch, 
    FormControlLabel, 
    Paper, 
    TextField, 
    Select, 
    MenuItem, 
    InputLabel, 
    FormControl,
    Stack,
    Button,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import { Add as AddIcon, AccessTime as TimeIcon } from '@mui/icons-material';

export default function DripEditor({ program, curriculum }) {
    // Current state mock - in real app, this would come from program.drip_settings
    const [dripEnabled, setDripEnabled] = useState(false);
    const [scheduleMode, setScheduleMode] = useState('sequence'); // 'sequence' (days after enrollment) or 'date' (specific date)

    // Helper to get flat list of lessons for the table - reusing the idea from flat nodes but simplified logic here
    const getLessons = (nodes) => {
        let lessons = [];
        nodes.forEach(node => {
             // If section, verify children
             if (node.children && node.children.length > 0) {
                 lessons = lessons.concat(getLessons(node.children));
             } else if (node.type !== 'Module') {
                 // It's a lesson/quiz
                 lessons.push(node);
             }
        });
        return lessons;
    };

    const lessons = curriculum ? getLessons(curriculum) : [];

    return (
        <Stack spacing={4} sx={{ maxWidth: 800, mx: 'auto', py: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="h6" fontWeight="bold">Drip Content Schedule</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Control when students can access specific lessons.
                    </Typography>
                </Box>
                <FormControlLabel
                    control={<Switch checked={dripEnabled} onChange={e => setDripEnabled(e.target.checked)} />}
                    label="Enable Drip"
                />
            </Box>

            {dripEnabled && (
                <>
                    <Paper variant="outlined" sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>Global Settings</Typography>
                        <FormControl fullWidth size="small" sx={{ mb: 2, maxWidth: 300 }}>
                            <InputLabel>Schedule Mode</InputLabel>
                            <Select
                                value={scheduleMode}
                                onChange={e => setScheduleMode(e.target.value)}
                                label="Schedule Mode"
                            >
                                <MenuItem value="sequence">Days after enrollment</MenuItem>
                                <MenuItem value="date">Specific Date</MenuItem>
                            </Select>
                        </FormControl>
                        <Typography variant="caption" color="text.secondary">
                            {scheduleMode === 'sequence' 
                                ? "Content unlocks X days after the student enrolls." 
                                : "Content unlocks on a specific calendar date for all students."}
                        </Typography>
                    </Paper>

                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead sx={{ bgcolor: 'grey.50' }}>
                                <TableRow>
                                    <TableCell>Content</TableCell>
                                    <TableCell width={200}>{scheduleMode === 'sequence' ? 'Unlock After (Days)' : 'Unlock Date'}</TableCell>
                                    <TableCell width={100}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {lessons.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                            No lessons found in curriculum.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {lessons.map((lesson) => (
                                    <TableRow key={lesson.id}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" fontWeight={500}>{lesson.title}</Typography>
                                                <Chip label={lesson.type} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {scheduleMode === 'sequence' ? (
                                                 <TextField 
                                                    type="number" 
                                                    size="small" 
                                                    placeholder="0" 
                                                    InputProps={{ endAdornment: <Typography variant="caption" sx={{ml:1}}>Days</Typography> }}
                                                 />
                                            ) : (
                                                <TextField 
                                                    type="date" 
                                                    size="small" 
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Switch size="small" defaultChecked />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained" size="large">Save Schedule</Button>
                    </Box>
                </>
            )}
             {!dripEnabled && (
                <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'grey.50', borderRadius: 2, border: '1px dashed #ddd' }}>
                     <TimeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">Drip content is currently disabled.</Typography>
                    <Typography variant="caption" color="text.disabled">Enable it to schedule content availability.</Typography>
                </Box>
            )}
        </Stack>
    );
}
