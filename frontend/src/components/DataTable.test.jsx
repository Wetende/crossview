import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import DataTable from './DataTable';

const columns = [{ id: 'name', label: 'Name' }];
const rows = [
  { id: 1, name: 'Selectable row', selectable: true },
  { id: 2, name: 'Protected row', selectable: false },
];

const isRowSelectable = (row) => row.selectable;

describe('DataTable row selection', () => {
  test('select all includes only eligible rows', () => {
    const onSelectionChange = vi.fn();

    render(
      <DataTable
        columns={columns}
        rows={rows}
        selectable
        isRowSelectable={isRowSelectable}
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
      />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[2]).toBeDisabled();

    fireEvent.click(checkboxes[0]);

    expect(onSelectionChange).toHaveBeenCalledWith([1]);
  });

  test('ignores row clicks for ineligible rows', () => {
    const onSelectionChange = vi.fn();

    render(
      <DataTable
        columns={columns}
        rows={rows}
        selectable
        isRowSelectable={isRowSelectable}
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(screen.getByText('Protected row'));
    expect(onSelectionChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Selectable row'));
    expect(onSelectionChange).toHaveBeenCalledWith([1]);
  });

  test('select all is checked when every eligible row is selected', () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        selectable
        isRowSelectable={isRowSelectable}
        selectedIds={[1]}
        onSelectionChange={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('checkbox')[0]).toBeChecked();
  });
});
