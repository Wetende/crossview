import { useState } from 'react';
import {
  Stack,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import AnswerExplanationPopover from './AnswerExplanationPopover';

/**
 * MatchingPairsEditor - STM LMS style matching question editor
 * Two-column layout: Question | Answer with editable placeholders
 */
export default function MatchingPairsEditor({ pairs = [], onChange }) {
  const [editingField, setEditingField] = useState(null);
  const [explanationAnchor, setExplanationAnchor] = useState(null);
  const [activeExplanationIndex, setActiveExplanationIndex] = useState(null);

  // Ensure we have at least 2 default pairs for matching
  const safePairs = pairs.length >= 2 ? pairs : [
    { left_text: '', right_text: '', explanation: '', position: 0 },
    { left_text: '', right_text: '', explanation: '', position: 1 },
  ];

  const handleAddPair = () => {
    const newPairs = [
      ...safePairs,
      { left_text: '', right_text: '', explanation: '', position: safePairs.length },
    ];
    onChange(newPairs);
  };

  const handleUpdate = (index, field, value) => {
    const newPairs = [...safePairs];
    newPairs[index] = { ...newPairs[index], [field]: value };
    onChange(newPairs);
  };

  const handleRemove = (index) => {
    if (safePairs.length <= 2) {
      // Minimum 2 pairs required for matching
      return;
    }
    const newPairs = safePairs
      .filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, position: i }));
    onChange(newPairs);
  };

  const handleFocus = (index, field) => {
    setEditingField(`${index}-${field}`);
  };

  const handleBlur = () => {
    setEditingField(null);
  };

  const isFieldEmpty = (value) => !value || value.trim() === '';

  // Explanation handlers
  const handleOpenExplanation = (event, index) => {
    setExplanationAnchor(event.currentTarget);
    setActiveExplanationIndex(index);
  };

  const handleCloseExplanation = () => {
    setExplanationAnchor(null);
    setActiveExplanationIndex(null);
  };

  return (
    <Box>
      {/* Header */}
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 500, mb: 2, color: 'text.secondary' }}
      >
        Questions & Answers
      </Typography>

      {/* Pairs List */}
      <Stack spacing={2}>
        {safePairs.map((pair, index) => (
          <Paper
            key={index}
            variant="outlined"
            sx={{
              display: 'flex',
              borderColor: 'divider',
              overflow: 'hidden',
            }}
          >
            {/* Question Column */}
            <Box
              sx={{
                flex: 1,
                p: 2,
                bgcolor: 'grey.50',
                borderRight: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ display: 'block', mb: 0.5 }}
              >
                Question
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  variant="standard"
                  placeholder="Enter your question"
                  value={pair.left_text}
                  onChange={(e) => handleUpdate(index, 'left_text', e.target.value)}
                  onFocus={() => handleFocus(index, 'left')}
                  onBlur={handleBlur}
                  slotProps={{
                    input: {
                      disableUnderline: editingField !== `${index}-left`,
                      endAdornment: (
                        <InputAdornment position="end">
                          <EditIcon
                            sx={{ fontSize: 16, color: 'text.disabled' }}
                          />
                        </InputAdornment>
                      ),
                      sx: {
                        fontSize: '0.9rem',
                        '& input': {
                          color: pair.left_text ? 'text.primary' : 'text.secondary',
                        },
                      },
                    },
                  }}
                />
              </Box>
              {/* Validation message */}
              {isFieldEmpty(pair.left_text) && (
                <Typography
                  variant="caption"
                  sx={{ color: 'error.main', mt: 0.5, display: 'block' }}
                >
                  This field is required
                </Typography>
              )}
            </Box>

            {/* Answer Column */}
            <Box
              sx={{
                flex: 1,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ display: 'block', mb: 0.5 }}
              >
                Answer
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  variant="standard"
                  placeholder="Enter matching answer"
                  value={pair.right_text}
                  onChange={(e) => handleUpdate(index, 'right_text', e.target.value)}
                  onFocus={() => handleFocus(index, 'right')}
                  onBlur={handleBlur}
                  slotProps={{
                    input: {
                      disableUnderline: editingField !== `${index}-right`,
                      endAdornment: (
                        <InputAdornment position="end">
                          <EditIcon
                            sx={{ fontSize: 16, color: 'text.disabled' }}
                          />
                        </InputAdornment>
                      ),
                      sx: {
                        fontSize: '0.9rem',
                        '& input': {
                          color: pair.right_text ? 'text.primary' : 'text.secondary',
                        },
                      },
                    },
                  }}
                />
                {/* Add explanation button */}
                <Button
                  size="small"
                  startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                  onClick={(e) => handleOpenExplanation(e, index)}
                  sx={{
                    textTransform: 'none',
                    color: 'primary.main',
                    fontSize: '0.7rem',
                    minWidth: 'auto',
                    ml: 1,
                  }}
                >
                  Explain
                </Button>
                {/* Delete button - only show if more than 2 pairs */}
                {safePairs.length > 2 && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemove(index)}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              {/* Validation message */}
              {isFieldEmpty(pair.right_text) && (
                <Typography
                  variant="caption"
                  sx={{ color: 'error.main', mt: 0.5, display: 'block' }}
                >
                  This field is required
                </Typography>
              )}
            </Box>
          </Paper>
        ))}
      </Stack>

      {/* Add New Answer Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddPair}
          sx={{
            color: 'primary.main',
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': {
              bgcolor: 'primary.50',
            },
          }}
        >
          Add new answer
        </Button>
      </Box>

      <AnswerExplanationPopover
        open={Boolean(explanationAnchor)}
        anchorEl={explanationAnchor}
        onClose={handleCloseExplanation}
        value={activeExplanationIndex !== null ? (safePairs[activeExplanationIndex]?.explanation || '') : ''}
        onChange={(value) => {
          if (activeExplanationIndex !== null) {
            handleUpdate(activeExplanationIndex, 'explanation', value);
          }
        }}
      />
    </Box>
  );
}
