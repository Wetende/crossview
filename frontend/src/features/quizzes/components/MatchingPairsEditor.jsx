import { Stack, TextField, IconButton, Button, Typography, Box } from '@mui/material';
import { IconTrash, IconPlus } from '@tabler/icons-react';

export default function MatchingPairsEditor({ pairs, onChange }) {
  const handleAddPair = () => {
    onChange([
      ...pairs,
      { left_text: '', right_text: '', position: pairs.length }
    ]);
  };

  const handleUpdate = (index, field, value) => {
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], [field]: value };
    onChange(newPairs);
  };

  const handleRemove = (index) => {
    const newPairs = pairs.filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, position: i })); // Reindex
    onChange(newPairs);
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Matching Pairs (Left - Right)
      </Typography>
      <Stack spacing={2}>
        {pairs.map((pair, index) => (
          <Stack key={index} direction="row" spacing={1} alignItems="center">
            <TextField
              placeholder="Left Item (e.g. Country)"
              value={pair.left_text}
              onChange={(e) => handleUpdate(index, 'left_text', e.target.value)}
              size="small"
              fullWidth
            />
            <Typography variant="body2">=</Typography>
            <TextField
              placeholder="Right Item (e.g. Capital)"
              value={pair.right_text}
              onChange={(e) => handleUpdate(index, 'right_text', e.target.value)}
              size="small"
              fullWidth
            />
            <IconButton color="error" onClick={() => handleRemove(index)}>
              <IconTrash size={18} />
            </IconButton>
          </Stack>
        ))}
        <Button startIcon={<IconPlus />} onClick={handleAddPair} variant="outlined" size="small">
          Add Pair
        </Button>
      </Stack>
    </Box>
  );
}
