import { useState, useEffect } from 'react';
import { Stack, Paper, Typography, Box } from '@mui/material';


// NOTE: Using DragDropContext might be overkill if we just want simple select matching.
// But for drag-drop, we need strict mode setup or alternative.
// Simplified version: Select Left -> Select Right to pair.

export default function MatchingQuestion({ question, onChange, value = [] }) {
  // value: array of pairs [{left, right}] or just dictionary {leftId: rightId}
  // Let's assume value is object { "left_text": "right_text_selected" }
  
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

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    // Logic for drag drop is complex with strict mode in React 18
    // Fallback to simple select for robustness if dnd fails?
  };
  
  // Implementation using simple select for now to avoid dnd library issues in this environment
  // A clean matching UI: Left Column (Static) | Right Column (Dropdowns)
  
  const handleSelect = (leftText, rightText) => {
      const newSelections = { ...selections, [leftText]: rightText };
      setSelections(newSelections);
      onChange(newSelections); // Pass back up
  };

  return (
    <Box>
      <Typography fontWeight="medium" gutterBottom>{question.text}</Typography>
      <Stack spacing={2} sx={{ mt: 2 }}>
        {pairs.map((pair, idx) => (
          <Stack key={idx} direction="row" spacing={2} alignItems="center">
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
