import { usePage } from '@inertiajs/react';
import {
  Alert,
  Box,
  GlobalStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ReportFilterBar from './ReportFilterBar';

function getPrintLetterhead(platform, platformName) {
  const publicContent = platform?.publicContent || {};
  const printHeader = publicContent.printHeader || {};

  if (Array.isArray(printHeader.lines) && printHeader.lines.some(Boolean)) {
    return {
      logoUrl: printHeader.logoUrl || platform?.logoUrl,
      lines: printHeader.lines.filter(Boolean),
    };
  }

  return {
    logoUrl: printHeader.logoUrl || platform?.logoUrl,
    lines: [
      printHeader.title || publicContent.printInstitutionName || platformName,
      printHeader.subtitle || publicContent.printSubtitle || platform?.tagline,
      printHeader.unit || publicContent.printUnitName,
    ].filter(Boolean),
  };
}

function letterheadLineSx(index) {
  return {
    color: index === 0 ? 'text.primary' : 'text.secondary',
    fontSize: index === 0 ? { xs: '1.35rem', md: '1.65rem' } : '0.95rem',
    fontWeight: index === 0 ? 800 : 600,
    lineHeight: 1.15,
  };
}

export default function PrintableDocumentLayout({
  report,
  columns = [],
  rows = [],
  filters = {},
  summary = {},
  generatedAtDisplay,
  generatedBy,
  actions,
}) {
  const { platform } = usePage().props;
  const platformName = platform?.institutionName || platform?.name || 'Learning Platform';
  const letterhead = getPrintLetterhead(platform, platformName);
  const orientation = report?.orientation === 'landscape' ? 'landscape' : 'portrait';

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
      <GlobalStyles
        styles={{
          '@page': {
            size: `A4 ${orientation}`,
            margin: '12mm',
          },
          '@media print': {
            body: {
              background: '#fff !important',
            },
            '.report-actions': {
              display: 'none !important',
            },
            '.report-meta, .report-filter-bar': {
              display: 'none !important',
            },
            'iframe, [id*="kyro" i], [class*="kyro" i], [id*="chat" i], [class*="chat" i], [aria-label*="chat" i], [title*="chat" i]': {
              display: 'none !important',
            },
            'a[href]::after': {
              content: '"" !important',
            },
            'body > div[style*="position: fixed"], body > div[style*="position:fixed"]': {
              display: 'none !important',
            },
            '.report-shell': {
              boxShadow: 'none !important',
              border: '0 !important',
              margin: '0 !important',
              padding: '0 !important',
              maxWidth: 'none !important',
            },
            '.report-table th, .report-table td': {
              fontSize: '10px !important',
              padding: '5px 6px !important',
            },
          },
        }}
      />
      <Paper
        className="report-shell"
        elevation={0}
        sx={{
          maxWidth: orientation === 'landscape' ? 1320 : 940,
          mx: 'auto',
          p: { xs: 2, md: 4 },
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        <Box
          sx={{
            mb: 3,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr auto 1fr' },
            gap: 2,
            alignItems: 'start',
          }}
        >
          <Box
            sx={{
              gridColumn: { xs: '1', md: '2' },
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box
              className="report-letterhead"
              sx={{
                display: 'inline-grid',
                gridTemplateColumns: letterhead.logoUrl ? 'auto minmax(0, auto)' : 'auto',
                columnGap: { xs: 1.25, md: 1.75 },
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              {letterhead.logoUrl && (
                <Box
                  component="img"
                  className="report-letterhead-logo"
                  src={letterhead.logoUrl}
                  alt={platformName}
                  sx={{
                    width: 'auto',
                    height: { xs: 58, md: 76 },
                    maxWidth: { xs: 86, md: 112 },
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              )}
              <Box sx={{ textAlign: 'center', minWidth: 0 }}>
                {letterhead.lines.map((line, index) => (
                  <Typography
                    key={`${line}-${index}`}
                    component="div"
                    sx={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      letterSpacing: 0,
                      whiteSpace: 'normal',
                      ...letterheadLineSx(index),
                    }}
                  >
                    {line}
                  </Typography>
                ))}
              </Box>
            </Box>
            <Typography variant="h4" fontWeight={700}>
              {report?.title}
            </Typography>
            <Typography className="report-meta" variant="body2" color="text.secondary">
              Generated {generatedAtDisplay} by {generatedBy}
            </Typography>
          </Box>
          {actions && (
            <Box sx={{ gridColumn: { xs: '1', md: '3' }, justifySelf: { xs: 'center', md: 'end' } }}>
              {actions}
            </Box>
          )}
        </Box>

        {report?.isTruncated && (
          <Alert severity="warning" className="report-actions" sx={{ mb: 2 }}>
            This report is limited to the first {rows.length} rows.
          </Alert>
        )}

        <ReportFilterBar filters={filters} summary={summary} />

        <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Table className="report-table" size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align || 'left'}
                    sx={{ fontWeight: 700, bgcolor: 'grey.100', whiteSpace: 'nowrap' }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">No records found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow key={row.id || index}>
                    {columns.map((column) => (
                      <TableCell key={column.key} align={column.align || 'left'}>
                        {row[column.key] ?? '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
