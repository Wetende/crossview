export function buildReportUrl({
  scope,
  reportId,
  queryParams = {},
  selectedIds = [],
  format,
}) {
  const search = new URLSearchParams();

  Object.entries(queryParams || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, value);
  });

  if (selectedIds.length > 0) {
    search.set('ids', selectedIds.join(','));
  }

  if (format) {
    search.set('format', format);
  }

  const queryString = search.toString();
  const base = `/${scope}/reports/${reportId}/print/`;
  return queryString ? `${base}?${queryString}` : base;
}

