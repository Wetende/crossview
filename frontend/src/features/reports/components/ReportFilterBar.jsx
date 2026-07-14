import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

export default function ReportFilterBar({ filters = {}, summary = {} }) {
  const filterEntries = Object.entries(filters).filter(([, value]) => {
    if (!value) return false;
    const normalized = String(value).trim().toLowerCase();
    return normalized !== 'all' && normalized !== 'none';
  });
  const summaryEntries = Object.entries(summary).filter(([, value]) => value !== undefined);

  if (filterEntries.length === 0 && summaryEntries.length === 0) {
    return null;
  }

  return (
    <Box className="report-filter-bar" sx={{ my: 2 }}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {filterEntries.map(([key, value]) => (
          <Chip key={`filter-${key}`} label={`${key}: ${value}`} size="small" variant="outlined" />
        ))}
        {summaryEntries.map(([key, value]) => (
          <Chip key={`summary-${key}`} label={`${key}: ${value}`} size="small" color="primary" />
        ))}
      </Stack>
    </Box>
  );
}
