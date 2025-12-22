/**
 * Progress Bar Component
 * Requirements: 1.2, 2.3
 */

import { Box, LinearProgress, Typography } from '@mui/material';

export default function ProgressBar({
  value,
  showLabel = true,
  size = 'medium',
  color = 'primary',
  label,
}) {
  const height = size === 'small' ? 6 : size === 'large' ? 12 : 8;
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <Box sx={{ width: '100%' }}>
      {(showLabel || label) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          {label && (
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          )}
          {showLabel && (
            <Typography variant="body2" color="text.secondary">
              {clampedValue.toFixed(0)}%
            </Typography>
          )}
        </Box>
      )}
      <LinearProgress
        variant="determinate"
        value={clampedValue}
        color={color}
        sx={{
          height,
          borderRadius: height / 2,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            borderRadius: height / 2,
          },
        }}
      />
    </Box>
  );
}
