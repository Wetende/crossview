import { Stack, TextField, IconButton, Button, Typography, Box, Alert } from '@mui/material';
import { IconTrash, IconPlus, IconHelp } from '@tabler/icons-react';

export default function FillBlankEditor({ text, gaps, onTextChange, onGapsChange }) {
  // text: "The capital of France is {{blank}}."
  // gaps: [{ index: 0, accepted: ["Paris"] }]

  const parseGaps = (inputText) => {
    // Basic regex to find {{blank}} or [[blank]] placeholders? 
    // For simplicity, let's assume user manually defines accepted answers for each occurring gap
    // or we just let them add "Gap 1, Gap 2" definitions.
    // Better UX: User writes text with {{blank}}, we detect count.
    const gapCount = (inputText.match(/\{\{blank\}\}/g) || []).length;
    return gapCount;
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    onTextChange(newText);
    
    // Sync gaps count
    const count = (newText.match(/\{\{blank\}\}/g) || []).length;
    let newGaps = [...gaps];
    
    if (count > gaps.length) {
      for (let i = gaps.length; i < count; i++) {
        newGaps.push({ gap_index: i, accepted_answers: [] });
      }
    } else if (count < gaps.length) {
      newGaps = newGaps.slice(0, count);
    }
    onGapsChange(newGaps);
  };

  const updateGapAnswers = (index, valueString) => {
    const answers = valueString.split(',').map(s => s.trim()).filter(s => s);
    const newGaps = [...gaps];
    newGaps[index] = { ...newGaps[index], accepted_answers: answers };
    onGapsChange(newGaps);
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Use <code>{"{{blank}}"}</code> to insert a gap. Example: "Roses are {{blank}}."
      </Alert>
      <TextField
        label="Question Text"
        value={text}
        onChange={handleTextChange}
        fullWidth
        multiline
        rows={3}
        sx={{ mb: 3 }}
      />

      <Typography variant="subtitle2" gutterBottom>
        Gap Answers (Comma separated for variations)
      </Typography>
      <Stack spacing={2}>
        {gaps.map((gap, index) => (
          <TextField
            key={index}
            label={`Gap ${index + 1} Answers`}
            placeholder="e.g. Red, red, RED"
            value={gap.accepted_answers.join(', ')}
            onChange={(e) => updateGapAnswers(index, e.target.value)}
            fullWidth
            size="small"
          />
        ))}
      </Stack>
    </Box>
  );
}
