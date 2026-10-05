import Stack from '@mui/material/Stack';
import PrintButton from './PrintButton';
import ExportMenu from './ExportMenu';
import { buildReportUrl } from './reportUrls';

export default function ReportToolbar({
  scope,
  reportId,
  queryParams = {},
  selectedIds = [],
  printLabel = 'Print',
  disabled = false,
}) {
  const printUrl = buildReportUrl({ scope, reportId, queryParams, selectedIds });
  const csvUrl = buildReportUrl({
    scope,
    reportId,
    queryParams,
    selectedIds,
    format: 'csv',
  });

  return (
    <Stack direction="row" spacing={1} className="report-actions">
      <PrintButton href={printUrl} disabled={disabled} label={printLabel} />
      <ExportMenu csvUrl={csvUrl} disabled={disabled} />
    </Stack>
  );
}

