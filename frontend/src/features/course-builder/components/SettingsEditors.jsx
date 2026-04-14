import React from 'react';
import { 
    Box, 
    Typography, 
    Stack, 
    TextField, 
    Divider, 
    Button, 
    Paper, 
    IconButton,
    Switch,
    Tooltip 
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, InfoOutlined as InfoIcon } from '@mui/icons-material';
import RichTextEditor from '@/components/RichTextEditor';

// --- Pricing Editor ---
export const PricingEditor = ({ data, onChange }) => {
    const currency = data.currency || 'KES';
    const salePrice = data.sale_price ?? data.original_price ?? '';
    const isOneTimePurchase = data.one_time_purchase !== false; // default true

    return (
        <Stack spacing={0}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Pricing</Typography>

            {/* One-time purchase toggle */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Switch
                    checked={isOneTimePurchase}
                    onChange={e => onChange({ ...data, one_time_purchase: e.target.checked })}
                    color="primary"
                />
                <Typography variant="body1" sx={{ ml: 1 }}>One-time purchase</Typography>
            </Box>

            {/* Price */}
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                Price ({currency})
            </Typography>
            <TextField
                type="number"
                fullWidth
                size="small"
                placeholder="0"
                value={data.price || ''}
                onChange={e => onChange({ ...data, price: e.target.value })}
                sx={{ mb: 3, maxWidth: 280 }}
                inputProps={{ min: 0 }}
            />

            {/* Sale Price */}
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                Sale price ({currency})
            </Typography>
            <TextField
                type="number"
                fullWidth
                size="small"
                placeholder="0"
                value={salePrice}
                onChange={e => {
                    const { original_price, ...rest } = data;
                    onChange({ ...rest, sale_price: e.target.value });
                }}
                sx={{ mb: 3, maxWidth: 280 }}
                inputProps={{ min: 0 }}
            />

            {/* Sale date range */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                        Sale start date
                    </Typography>
                    <TextField
                        type="date"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={data.sale_start_date || ''}
                        onChange={e => onChange({ ...data, sale_start_date: e.target.value })}
                    />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                        Sale end date
                    </Typography>
                    <TextField
                        type="date"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={data.sale_end_date || ''}
                        onChange={e => onChange({ ...data, sale_end_date: e.target.value })}
                    />
                </Box>
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
                        <RichTextEditor
                            value={item.content || ''}
                            onChange={(value) => handleUpdate(index, 'content', value)}
                            minHeight={140}
                            placeholder="Write notice content..."
                        />
                    </Stack>
                </Paper>
            ))}
        </Stack>
    );
};
