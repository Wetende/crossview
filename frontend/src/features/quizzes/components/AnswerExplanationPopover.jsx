import {
  Box,
  IconButton,
  Popover,
  TextField,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export default function AnswerExplanationPopover({
  open,
  anchorEl,
  onClose,
  value,
  onChange,
  placeholder = 'Enter explanation',
}) {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Box sx={{ p: 2, width: 280 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1,
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Answer explanation
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Will be shown in &quot;Show answer&quot; section
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
        <TextField
          fullWidth
          size="small"
          placeholder={placeholder}
          value={value || ''}
          onChange={(event) => onChange?.(event.target.value)}
          multiline
          rows={2}
        />
      </Box>
    </Popover>
  );
}
