import { Stack, TextField, IconButton, Button, Typography, Box } from '@mui/material';
import { IconTrash, IconPlus, IconArrowsSort } from '@tabler/icons-react';

export default function OrderingEditor({ items, onChange }) {
  // items is array of strings in correct order
  
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
  };

  const moveItem = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === items.length - 1)) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index + direction];
    newItems[index + direction] = temp;
    onChange(newItems);
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Correct Sequence (Top to Bottom)
      </Typography>
      <Stack spacing={2}>
        {items.map((item, index) => (
          <Stack key={index} direction="row" spacing={1} alignItems="center">
            <Stack direction="column">
                <IconButton size="small" onClick={() => moveItem(index, -1)} disabled={index === 0}>▲</IconButton>
                <IconButton size="small" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1}>▼</IconButton>
            </Stack>
            <TextField
              placeholder={`Item ${index + 1}`}
              value={item}
              onChange={(e) => handleChange(index, e.target.value)}
              size="small"
              fullWidth
            />
            <IconButton color="error" onClick={() => handleRemove(index)}>
              <IconTrash size={18} />
            </IconButton>
          </Stack>
        ))}
        <Button startIcon={<IconPlus />} onClick={handleAdd} variant="outlined" size="small">
          Add Item
        </Button>
      </Stack>
    </Box>
  );
}
