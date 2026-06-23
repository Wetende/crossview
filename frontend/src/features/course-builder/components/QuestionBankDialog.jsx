import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Box,
    Typography,
    Alert,
    OutlinedInput
} from '@mui/material';
import { AccountBalance as BankIcon } from '@mui/icons-material';

/**
 * QuestionBankDialog - Dialog for creating question banks
 * 
 * A question bank pulls a random selection of questions from a category.
 * This allows instructors to create dynamic quizzes where different students
 * may receive different questions from the same pool.
 */
export default function QuestionBankDialog({
    open,
    onClose,
    onSave,
    categories = []
}) {
    const [bankName, setBankName] = useState('');
    const [questionCount, setQuestionCount] = useState(10);
    const [selectedCategories, setSelectedCategories] = useState([]);

    const handleSave = () => {
        if (!bankName.trim()) return;
        if (selectedCategories.length === 0) return;
        
        onSave({
            name: bankName,
            questionCount: questionCount,
            categories: selectedCategories
        });
        
        // Reset form
        setBankName('');
        setQuestionCount(10);
        setSelectedCategories([]);
    };

    const handleClose = () => {
        setBankName('');
        setQuestionCount(10);
        setSelectedCategories([]);
        onClose();
    };

    const handleCategoryChange = (event) => {
        const value = event.target.value;
        setSelectedCategories(typeof value === 'string' ? value.split(',') : value);
    };

    const isValid = bankName.trim().length > 0 && selectedCategories.length > 0 && questionCount > 0;

    return (
        <Dialog 
            open={open} 
            onClose={handleClose} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                bgcolor: '#e8f5e9',
                borderBottom: '1px solid #a5d6a7'
            }}>
                <BankIcon color="success" />
                <Typography variant="h6">Questions Bank</Typography>
            </DialogTitle>
            
            <DialogContent sx={{ pt: 3 }}>
                <Stack spacing={3}>
                    <Alert severity="info" sx={{ fontSize: '0.85rem' }}>
                        This type of question is not a question in itself. A bank is just a group of questions 
                        from a certain category. Questions from this category will be shown in a separate block, 
                        with the group name you will write below.
                    </Alert>

                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        alignItems={{ xs: 'stretch', sm: 'flex-end' }}
                    >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <InputLabel
                                htmlFor="question-bank-name"
                                shrink
                                required
                                sx={{ mb: 1, fontWeight: 500 }}
                            >
                                Bank name
                            </InputLabel>
                            <TextField
                                id="question-bank-name"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="Midterm Questions"
                                fullWidth
                                required
                            />
                        </Box>
                        
                        <TextField
                            label="Select number of questions"
                            type="number"
                            value={questionCount}
                            onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
                            sx={{ minWidth: 200 }}
                            InputProps={{ inputProps: { min: 1 } }}
                            required
                        />
                    </Stack>

                    <FormControl fullWidth required>
                        <InputLabel>Select categories</InputLabel>
                        <Select
                            multiple
                            value={selectedCategories}
                            onChange={handleCategoryChange}
                            input={<OutlinedInput label="Select categories" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip 
                                            key={value} 
                                            label={value} 
                                            size="small"
                                            sx={{ bgcolor: 'primary.light', color: 'white' }}
                                        />
                                    ))}
                                </Box>
                            )}
                        >
                            {categories.length === 0 ? (
                                <MenuItem disabled>
                                    <em>No categories available</em>
                                </MenuItem>
                            ) : (
                                categories.map((category) => (
                                    <MenuItem key={category} value={category}>
                                        {category}
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                    </FormControl>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose}>
                    Cancel
                </Button>
                <Button 
                    variant="contained" 
                    color="success"
                    onClick={handleSave}
                    disabled={!isValid}
                    startIcon={<BankIcon />}
                >
                    Save Question Bank
                </Button>
            </DialogActions>
        </Dialog>
    );
}
