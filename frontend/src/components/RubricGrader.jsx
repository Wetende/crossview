/**
 * RubricGrader Component
 * Display rubric criteria with score inputs
 * Requirements: FR-5.4
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Typography,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Divider,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';

export default function RubricGrader({
  rubric,
  scores = {},
  onChange,
  readOnly = false,
}) {
  const [localScores, setLocalScores] = useState(scores);

  useEffect(() => {
    setLocalScores(scores);
  }, [scores]);

  const handleScoreChange = useCallback(
    (dimensionKey, newScore) => {
      if (readOnly) return;
      
      const updated = {
        ...localScores,
        [dimensionKey]: newScore,
      };
      setLocalScores(updated);
      onChange?.(updated);
    },
    [localScores, onChange, readOnly]
  );

  // Calculate total score
  const totalScore = Object.values(localScores).reduce(
    (sum, score) => sum + (score || 0),
    0
  );
  const maxScore = rubric?.maxScore || rubric?.dimensions?.length * 4 || 0;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  if (!rubric || !rubric.dimensions) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">No rubric configured</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h6" gutterBottom>
            {rubric.name || 'Grading Rubric'}
          </Typography>
          {rubric.description && (
            <Typography variant="body2" color="text.secondary">
              {rubric.description}
            </Typography>
          )}
        </Box>

        <Divider />

        {/* Dimensions */}
        {rubric.dimensions.map((dimension, index) => (
          <motion.div
            key={dimension.key || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <RubricDimension
              dimension={dimension}
              score={localScores[dimension.key || dimension.name]}
              onChange={(score) =>
                handleScoreChange(dimension.key || dimension.name, score)
              }
              readOnly={readOnly}
            />
          </motion.div>
        ))}

        <Divider />

        {/* Total Score */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">Total Score</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h5" color="primary.main">
              {totalScore} / {maxScore}
            </Typography>
            <Chip
              label={`${percentage}%`}
              color={percentage >= 70 ? 'success' : percentage >= 50 ? 'warning' : 'error'}
            />
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

function RubricDimension({ dimension, score, onChange, readOnly }) {
  const levels = dimension.levels || [
    { score: 1, label: 'Beginning', description: 'Does not meet expectations' },
    { score: 2, label: 'Developing', description: 'Partially meets expectations' },
    { score: 3, label: 'Proficient', description: 'Meets expectations' },
    { score: 4, label: 'Exemplary', description: 'Exceeds expectations' },
  ];

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
        {dimension.name || dimension.label}
      </Typography>
      {dimension.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {dimension.description}
        </Typography>
      )}

      <ToggleButtonGroup
        value={score}
        exclusive
        onChange={(e, newScore) => {
          if (newScore !== null) onChange(newScore);
        }}
        disabled={readOnly}
        sx={{ flexWrap: 'wrap', gap: 1 }}
      >
        {levels.map((level) => (
          <Tooltip
            key={level.score}
            title={level.description || ''}
            placement="top"
          >
            <ToggleButton
              value={level.score}
              sx={{
                px: 2,
                py: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                },
              }}
            >
              <Stack alignItems="center" spacing={0.5}>
                <Typography variant="h6">{level.score}</Typography>
                <Typography variant="caption">{level.label}</Typography>
              </Stack>
            </ToggleButton>
          </Tooltip>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}

RubricGrader.propTypes = {
  rubric: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    dimensions: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string,
        name: PropTypes.string,
        label: PropTypes.string,
        description: PropTypes.string,
        levels: PropTypes.arrayOf(
          PropTypes.shape({
            score: PropTypes.number.isRequired,
            label: PropTypes.string,
            description: PropTypes.string,
          })
        ),
      })
    ),
    maxScore: PropTypes.number,
  }),
  scores: PropTypes.object,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
};
