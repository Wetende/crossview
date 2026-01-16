/**
 * CourseSearch Component
 * Search input for filtering gradebook courses
 */

import { Box, TextField, Typography, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function CourseSearch({ value, onChange, placeholder = 'Enter keyword here' }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography
        variant="overline"
        sx={{
          fontWeight: 600,
          letterSpacing: 1.5,
          color: 'text.secondary',
          whiteSpace: 'nowrap',
        }}
      >
        SEARCH COURSES
      </Typography>
      <TextField
        size="small"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          ),
        }}
        sx={{
          minWidth: 200,
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            '& fieldset': {
              borderColor: 'divider',
            },
          },
        }}
      />
    </Box>
  );
}
