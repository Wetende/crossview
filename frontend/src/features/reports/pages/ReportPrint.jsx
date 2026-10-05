import { Head } from '@inertiajs/react';
import PrintableDocumentLayout from '../components/PrintableDocumentLayout';
import PrintButton from '../components/PrintButton';
import ExportMenu from '../components/ExportMenu';

function csvUrl() {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('format', 'csv');
  return `${url.pathname}${url.search}`;
}

export default function ReportPrint({
  report,
  columns = [],
  rows = [],
  filters = {},
  summary = {},
  generatedAtDisplay,
  generatedBy,
}) {
  return (
    <>
      <Head title={report?.title || 'Report'} />
      <PrintableDocumentLayout
        report={report}
        columns={columns}
        rows={rows}
        filters={filters}
        summary={summary}
        generatedAtDisplay={generatedAtDisplay}
        generatedBy={generatedBy}
        actions={(
          <div className="report-actions">
            <PrintButton />
            <ExportMenu csvUrl={csvUrl()} />
          </div>
        )}
      />
    </>
  );
}

