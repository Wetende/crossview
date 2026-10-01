import { useState } from 'react';
import { Stack, TextField, IconButton, Button, Typography, Box } from '@mui/material';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { Add as AddIcon } from '@mui/icons-material';
import AnswerExplanationPopover from './AnswerExplanationPopover';

export default function OrderingEditor({ items, explanations = {}, onChange, onExplanationsChange }) {
  const [explanationAnchor, setExplanationAnchor] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);

  const handleAdd = () => {
    onChange([...items, '']);
  };

  const handleChange = (index, value) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  };

  const handleRemove = (index) => {
    onChange(items.filter((_, i) => i !== index));
    // Also remove the explanation for this item
    if (onExplanationsChange) {
      const newExplanations = { ...explanations };
      delete newExplanations[`item_${index}`];
      onExplanationsChange(newExplanations);
    }
  };

  const moveItem = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === items.length - 1)) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index + direction];
    newItems[index + direction] = temp;
    onChange(newItems);
  };

  const handleOpenExplanation = (event, index) => {
    setExplanationAnchor(event.currentTarget);
    setActiveIndex(index);
  };

  const handleCloseExplanation = () => {
    setExplanationAnchor(null);
    setActiveIndex(null);
  };

  const handleUpdateExplanation = (value) => {
    if (activeIndex !== null && onExplanationsChange) {
      onExplanationsChange({ ...explanations, [`item_${activeIndex}`]: value });
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Correct Sequence (Top to Bottom)
      </Typography>
      <Stack spacing={2}>
        {items.map((item, index) => (
          <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Stack direction="column">
              <IconButton size="small" onClick={() => moveItem(index, -1)} disabled={index === 0}>
                ▲
              </IconButton>
              <IconButton size="small" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1}>
                ▼
              </IconButton>
            </Stack>
            <TextField
              placeholder={`Item ${index + 1}`}
              value={item}
              onChange={(e) => handleChange(index, e.target.value)}
              size="small"
              fullWidth
            />
            <Button
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 14 }} />}
              onClick={(e) => handleOpenExplanation(e, index)}
              sx={{
                textTransform: 'none',
                color: 'primary.main',
                fontSize: '0.7rem',
                minWidth: 'auto',
              }}
            >
              Explain
            </Button>
            <IconButton color="error" onClick={() => handleRemove(index)}>
              <IconTrash size={18} />
            </IconButton>
          </Stack>
        ))}
        <Button startIcon={<IconPlus />} onClick={handleAdd} variant="outlined" size="small">
          Add Item
        </Button>
      </Stack>

      <AnswerExplanationPopover
        open={Boolean(explanationAnchor)}
        anchorEl={explanationAnchor}
        onClose={handleCloseExplanation}
        value={activeIndex !== null ? (explanations[`item_${activeIndex}`] || '') : ''}
        onChange={handleUpdateExplanation}
      />
    </Box>
  );
}
