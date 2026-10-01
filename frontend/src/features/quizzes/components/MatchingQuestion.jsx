import { useState, useEffect } from 'react';
import { Stack, Paper, Typography, Box } from '@mui/material';

export default function MatchingQuestion({ question, onChange, value = [] }) {
  const [pairs, setPairs] = useState(question.pairs || []);
  const [shuffledRight, setShuffledRight] = useState([]);
  const [selections, setSelections] = useState(value || {}); // { "Left Text": "Right Text" }

  useEffect(() => {
    // Shuffle right sides
    const rightSides = pairs.map(p => p.right_text);
    // Simple shuffle
    const shuffled = [...rightSides].sort(() => Math.random() - 0.5);
    setShuffledRight(shuffled);
  }, [pairs]);
  
  const handleSelect = (leftText, rightText) => {
      const newSelections = { ...selections, [leftText]: rightText };
      setSelections(newSelections);
      onChange(newSelections); // Pass back up
  };

  return (
    <Box>
      <Typography sx={{ fontWeight: 'medium' }} gutterBottom>{question.text}</Typography>
      <Stack spacing={2} sx={{ mt: 2 }}>
        {pairs.map((pair, idx) => (
          <Stack key={idx} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Paper variant="outlined" sx={{ p: 2, flex: 1, bgcolor: 'custom.light' }}>
               {pair.left_text}
            </Paper>
            <Typography>=</Typography>
            <Box sx={{ flex: 1 }}>
                <select 
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', borderColor: '#e0e0e0' }}
                    value={selections[pair.left_text] || ''}
                    onChange={(e) => handleSelect(pair.left_text, e.target.value)}
                >
                    <option value="">Select match...</option>
                    {shuffledRight.map((r, rIdx) => (
                        <option key={rIdx} value={r}>{r}</option>
                    ))}
                </select>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
