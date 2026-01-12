import { useState, useEffect } from 'react';
import { Stack, Paper, Typography, Box, IconButton } from '@mui/material';
import { IconArrowUp, IconArrowDown } from '@tabler/icons-react';

export default function OrderingQuestion({ question, onChange, value = [] }) {
  const [items, setItems] = useState([]); // Array of strings in user's order

  useEffect(() => {
    if (value && value.length > 0) {
      setItems(value);
    } else {
      // Initialize with shuffled items
      const initial = question.items || [];
      const shuffled = [...initial].sort(() => Math.random() - 0.5);
      setItems(shuffled);
      // Don't call onChange immediately? Or do we want to count random as answer?
      // Better to require interaction.
    }
  }, [question, value]);

  const move = (index, direction) => {
      if ((direction === -1 && index === 0) || (direction === 1 && index === items.length - 1)) return;
      const newItems = [...items];
      const temp = newItems[index];
      newItems[index] = newItems[index + direction];
      newItems[index + direction] = temp;
      setItems(newItems);
      onChange(newItems);
  };

  return (
    <Box>
      <Typography fontWeight="medium" gutterBottom>{question.text}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Arrange the items in the correct order.
      </Typography>
      <Stack spacing={1}>
        {items.map((item, idx) => (
           <Paper key={idx} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Stack>
                  <IconButton size="small" onClick={() => move(idx, -1)} disabled={idx === 0}>
                      <IconArrowUp size={16} />
                  </IconButton>
                  <IconButton size="small" onClick={() => move(idx, 1)} disabled={idx === items.length - 1}>
                      <IconArrowDown size={16} />
                  </IconButton>
              </Stack>
              <Typography>{item}</Typography>
           </Paper>
        ))}
      </Stack>
    </Box>
  );
}
