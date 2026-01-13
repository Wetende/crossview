import React, { useState } from 'react';
import { 
    Box, 
    Typography, 
    Stack, 
    TextField, 
    Divider, 
    Button, 
    Paper, 
    IconButton 
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

// --- Pricing Editor ---
export const PricingEditor = ({ data, onChange }) => {
    return (
        <Stack spacing={3}>
             <Typography variant="h6" fontWeight="bold">Pricing</Typography>
             <Box sx={{ display: 'flex', gap: 2 }}>
                 <TextField 
                    label="Regular Price" 
                    type="number" 
                    fullWidth 
                    value={data.price || ''} 
                    onChange={e => onChange({ ...data, price: e.target.value })}
                    InputProps={{ startAdornment: <Box sx={{mr:1}}>$</Box> }} 
                 />
                 <TextField 
                    label="Currency" 
                    fullWidth 
                    value={data.currency || 'USD'} 
                    onChange={e => onChange({ ...data, currency: e.target.value })} 
                 />
             </Box>
             
             <Divider sx={{ my: 2 }} />
             <Typography variant="subtitle2" fontWeight="bold">Sale Price (Optional)</Typography>
             
             <Box sx={{ display: 'flex', gap: 2 }}>
                 <TextField 
                    label="Sale Price" 
                    type="number" 
                    fullWidth 
                    value={data.sale_price || ''} 
                    onChange={e => onChange({ ...data, sale_price: e.target.value })}
                    InputProps={{ startAdornment: <Box sx={{mr:1}}>$</Box> }} 
                 />
             </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                 <TextField 
                    label="Sale Start Date" 
                    type="date" 
                    fullWidth 
                    InputLabelProps={{ shrink: true }}
                    value={data.sale_start_date || ''} 
                    onChange={e => onChange({ ...data, sale_start_date: e.target.value })} 
                 />
                 <TextField 
                    label="Sale End Date" 
                    type="date" 
                    fullWidth 
                    InputLabelProps={{ shrink: true }}
                    value={data.sale_end_date || ''} 
                    onChange={e => onChange({ ...data, sale_end_date: e.target.value })} 
                 />
             </Box>
        </Stack>
    );
};

// --- FAQ Editor ---
export const FAQEditor = ({ data, onChange }) => {
    // data is array of { question, answer }
    const items = Array.isArray(data) ? data : [];

    const handleAdd = () => {
        onChange([...items, { question: '', answer: '' }]);
    };

    const handleUpdate = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        onChange(newItems);
    };

    const handleDelete = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        onChange(newItems);
    };

    return (
        <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="bold">Frequently Asked Questions</Typography>
                <Button startIcon={<AddIcon />} variant="outlined" onClick={handleAdd}>Add FAQ</Button>
            </Box>
            
            {items.length === 0 && (
                <Typography color="text.secondary" align="center" py={4}>No FAQs added yet.</Typography>
            )}

            {items.map((item, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <IconButton size="small" color="error" onClick={() => handleDelete(index)}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Stack spacing={2}>
                        <TextField 
                            label="Question" 
                            fullWidth 
                            size="small" 
                            value={item.question} 
                            onChange={e => handleUpdate(index, 'question', e.target.value)} 
                        />
                        <TextField 
                            label="Answer" 
                            fullWidth 
                            multiline 
                            rows={2} 
                            size="small" 
                            value={item.answer} 
                            onChange={e => handleUpdate(index, 'answer', e.target.value)} 
                        />
                    </Stack>
                </Paper>
            ))}
        </Stack>
    );
};

// --- Notice Editor ---
export const NoticeEditor = ({ data, onChange }) => {
     // data is array of objects { title, content } for robustness, logic handles strings too if needed
    const items = Array.isArray(data) ? data.map(i => typeof i === 'string' ? { title: 'Notice', content: i } : i) : [];

    const handleAdd = () => {
        onChange([...items, { title: '', content: '' }]);
    };

    const handleUpdate = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        onChange(newItems);
    };

    const handleDelete = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        onChange(newItems);
    };

    return (
        <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="bold">Program Notices</Typography>
                <Button startIcon={<AddIcon />} variant="outlined" onClick={handleAdd}>Add Notice</Button>
            </Box>

             {items.length === 0 && (
                <Typography color="text.secondary" align="center" py={4}>No notices added yet.</Typography>
            )}

             {items.map((item, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2, bgcolor: '#fff8e1' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" fontWeight="bold" color="warning.dark">NOTICE {index + 1}</Typography>
                        <IconButton size="small" color="error" onClick={() => handleDelete(index)}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Stack spacing={2}>
                        <TextField 
                            label="Title" 
                            fullWidth 
                            size="small" 
                            value={item.title} 
                            onChange={e => handleUpdate(index, 'title', e.target.value)} 
                        />
                        <TextField 
                            label="Content" 
                            fullWidth 
                            multiline 
                            rows={2} 
                            size="small" 
                            value={item.content} 
                            onChange={e => handleUpdate(index, 'content', e.target.value)} 
                        />
                    </Stack>
                </Paper>
            ))}
        </Stack>
    );
};
