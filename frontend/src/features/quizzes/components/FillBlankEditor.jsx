import { useRef, useState } from 'react';
import { Stack, TextField, Button, Typography, Box } from '@mui/material';
import { IconTrash, IconPlus, IconHelp } from '@tabler/icons-react';
import { Add as AddIcon } from '@mui/icons-material';
import AnswerExplanationPopover from './AnswerExplanationPopover';

const BLANK_TOKEN_REGEX = /\{\{\s*blank\s*\}\}/gi;

const normalizeBlankTokens = (value) => {
  if (typeof value !== 'string') return '';
  return value
    .replace(/_{3,}/g, '{{blank}}')
    .replace(BLANK_TOKEN_REGEX, '{{blank}}');
};

export default function FillBlankEditor({ text, gaps, onTextChange, onGapsChange }) {
  const [explanationAnchor, setExplanationAnchor] = useState(null);
  const [activeGapIndex, setActiveGapIndex] = useState(null);
  const textInputRef = useRef(null);

  const syncTextAndGaps = (nextText) => {
    const normalizedText = normalizeBlankTokens(nextText);
    onTextChange(normalizedText);
    
    const count = (normalizedText.match(/\{\{blank\}\}/g) || []).length;
    let newGaps = [...gaps];

    if (count > gaps.length) {
      for (let i = gaps.length; i < count; i++) {
        newGaps.push({ gap_index: i, accepted_answers: [], explanation: '' });
      }
    } else if (count < gaps.length) {
      newGaps = newGaps.slice(0, count);
    }
    onGapsChange(newGaps);
  };

  const handleTextChange = (e) => {
    syncTextAndGaps(e.target.value);
  };

  const handleInsertBlank = () => {
    const target = textInputRef.current;
    const token = '{{blank}}';
    const currentText = String(text || '');

    if (!target || typeof target.selectionStart !== 'number') {
      syncTextAndGaps(currentText ? `${currentText} ${token}` : token);
      return;
    }

    const start = target.selectionStart;
    const end = target.selectionEnd;
    const before = currentText.slice(0, start);
    const after = currentText.slice(end);

    const needsLeadingSpace = before.length > 0 && !/\s$/.test(before);
    const needsTrailingSpace = after.length > 0 && !/^\s/.test(after);
    const insertion = `${needsLeadingSpace ? ' ' : ''}${token}${needsTrailingSpace ? ' ' : ''}`;
    const nextText = `${before}${insertion}${after}`;

    syncTextAndGaps(nextText);

    requestAnimationFrame(() => {
      const newPosition = before.length + insertion.length;
      target.focus();
      target.setSelectionRange(newPosition, newPosition);
    });
  };

  const updateGapAnswers = (index, valueString) => {
    const answers = valueString.split(',').map(s => s.trim()).filter(s => s);
    const newGaps = [...gaps];
    newGaps[index] = { ...newGaps[index], accepted_answers: answers };
    onGapsChange(newGaps);
  };

  const updateGapExplanation = (index, value) => {
    const newGaps = [...gaps];
    newGaps[index] = { ...newGaps[index], explanation: value };
    onGapsChange(newGaps);
  };

  const handleOpenExplanation = (event, index) => {
    setExplanationAnchor(event.currentTarget);
    setActiveGapIndex(index);
  };

  const handleCloseExplanation = () => {
    setExplanationAnchor(null);
    setActiveGapIndex(null);
  };

  return (
    <Box>
      <TextField
        label="Question Text"
        value={text}
        onChange={handleTextChange}
        inputRef={textInputRef}
        fullWidth
        multiline
        rows={3}
        sx={{ mb: 3 }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={handleInsertBlank}
          sx={{ textTransform: 'none' }}
        >
          Insert blank
        </Button>
        <Typography variant="caption" color="textSecondary">
          Place your cursor where the gap should be, then click “Insert blank”.
        </Typography>
      </Box>

      <Typography variant="subtitle2" gutterBottom>
        Correct answers for each blank
      </Typography>
      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1.5 }}>
        Type the marking answers below. Use commas for accepted variations (example: color, colour).
      </Typography>
      <Stack spacing={2}>
        {gaps.map((gap, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <TextField
              label={`Gap ${index + 1} Answers`}
              placeholder="e.g. Red, red, RED"
              value={gap.accepted_answers.join(', ')}
              onChange={(e) => updateGapAnswers(index, e.target.value)}
              fullWidth
              size="small"
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
                whiteSpace: 'nowrap',
                mt: 0.5,
              }}
            >
              Explain
            </Button>
          </Box>
        ))}
      </Stack>

      <AnswerExplanationPopover
        open={Boolean(explanationAnchor)}
        anchorEl={explanationAnchor}
        onClose={handleCloseExplanation}
        value={activeGapIndex !== null ? (gaps[activeGapIndex]?.explanation || '') : ''}
        onChange={(value) => {
          if (activeGapIndex !== null) {
            updateGapExplanation(activeGapIndex, value);
          }
        }}
      />
    </Box>
  );
}
