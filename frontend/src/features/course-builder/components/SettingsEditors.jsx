import { 
    Alert,
    Box, 
    Typography, 
    Stack, 
    TextField, 
    Button, 
    Paper, 
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import RichTextEditor from '@/components/RichTextEditor';

// --- Pricing Editor ---
const hasPositivePrice = (value) => {
    const numeric = Number(value || 0);
    return Number.isFinite(numeric) && numeric > 0;
};

export const PricingEditor = ({
    data = {},
    onChange,
    recommendation = {},
    recommendations = {},
    platformFeatures = {},
    deploymentMode = "custom",
    examBody = "",
    qualificationFamily = "",
}) => {
    const currency = data.currency || 'KES';
    const originalPrice = data.original_price ?? data.sale_price ?? '';
    const paymentsEnabled = Boolean(platformFeatures.payments);
    const activeRecommendation =
        (hasPositivePrice(data.price) ? recommendations.paid : recommendations.free) ||
        recommendation;
    const paymentCollection =
        data.payment_collection || activeRecommendation.payment_collection || 'none';
    const cardDisplay = data.card_display || activeRecommendation.card_display || 'free';
    const differsFromRecommendation =
        activeRecommendation.payment_collection &&
        (paymentCollection !== activeRecommendation.payment_collection ||
            cardDisplay !== activeRecommendation.card_display);

    const setField = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    const handleApplyRecommendation = () => {
        onChange({
            ...data,
            payment_collection: activeRecommendation.payment_collection || 'none',
            card_display: activeRecommendation.card_display || 'free',
        });
    };

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant="h5" fontWeight="bold">Pricing</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Configure what learners see and how payment is collected for this course.
                </Typography>
            </Box>

            <Alert
                severity="info"
                action={
                    differsFromRecommendation ? (
                        <Button color="inherit" size="small" onClick={handleApplyRecommendation}>
                            Apply defaults
                        </Button>
                    ) : null
                }
            >
                Recommended for {deploymentMode}
                {examBody ? ` / ${examBody}` : ''}
                {qualificationFamily ? ` / ${qualificationFamily}` : ''}: {' '}
                {activeRecommendation.reason || 'Use the course context to choose pricing behavior.'}
            </Alert>

            {!paymentsEnabled && (
                <Alert severity="warning">
                    Online checkout is disabled for this platform. Use offline/manual payment
                    or no LMS payment collection.
                </Alert>
            )}

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                    type="number"
                    fullWidth
                    label={`Learner price (${currency})`}
                    placeholder="0"
                    value={data.price || ''}
                    onChange={e => setField('price', e.target.value)}
                    inputProps={{ min: 0 }}
                />
                <TextField
                    type="number"
                    fullWidth
                    label={`Original price (${currency})`}
                    placeholder="0"
                    value={originalPrice}
                    onChange={e => {
                        const nextData = { ...data, original_price: e.target.value };
                        delete nextData.sale_price;
                        onChange(nextData);
                    }}
                    inputProps={{ min: 0 }}
                    helperText="Optional comparison price for discounts."
                />
            </Stack>

            <FormControl fullWidth>
                <InputLabel>Payment collection</InputLabel>
                <Select
                    label="Payment collection"
                    value={paymentCollection}
                    onChange={e => setField('payment_collection', e.target.value)}
                >
                    <MenuItem value="none">No LMS payment collection</MenuItem>
                    <MenuItem value="offline">Offline/manual payment</MenuItem>
                    <MenuItem value="online" disabled={!paymentsEnabled}>
                        Online checkout
                    </MenuItem>
                    <MenuItem value="both" disabled={!paymentsEnabled}>
                        Online checkout and offline/manual
                    </MenuItem>
                </Select>
            </FormControl>

            <FormControl fullWidth>
                <InputLabel>Public card display</InputLabel>
                <Select
                    label="Public card display"
                    value={cardDisplay}
                    onChange={e => setField('card_display', e.target.value)}
                >
                    <MenuItem value="free">Show Free</MenuItem>
                    <MenuItem value="price">Show price</MenuItem>
                    <MenuItem value="hidden">Hide pricing</MenuItem>
                </Select>
            </FormControl>

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
