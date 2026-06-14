import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import EditableCell from './EditableCell.jsx';

const PAGE_SIZE = 50;
const MAX_ROWS = 10000;

export default function DataTable({ table }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [truncated, setTruncated] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [savingRow, setSavingRow] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const fetchRows = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const all = [];
      let cursor = null;
      let wasTruncated = false;
      do {
        const url = `/n8n-api/data-tables/${encodeURIComponent(table.id)}/rows?limit=250${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        all.push(...(data.data || []));
        cursor = data.nextCursor || null;
        if (all.length >= MAX_ROWS && cursor) {
          wasTruncated = true;
          break;
        }
      } while (cursor);
      setRows(all);
      setTruncated(wasTruncated);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [table.id]);

  useEffect(() => {
    const controller = new AbortController();
    fetchRows(controller.signal);
    setSorting([]);
    setColumnFilters([]);
    setSaveError(null);
    return () => controller.abort();
  }, [fetchRows]);

  const handleCellChange = useCallback(
    async (rowId, columnName, newValue) => {
      setSavingRow(rowId);
      setSaveError(null);
      try {
        const res = await fetch(`/n8n-api/data-tables/${encodeURIComponent(table.id)}/rows/update`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filter: {
              type: 'and',
              filters: [{ columnName: 'id', condition: 'eq', value: rowId }],
            },
            data: { [columnName]: newValue },
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        setRows(prev =>
          prev.map(r => (r.id === rowId ? { ...r, [columnName]: newValue } : r))
        );
      } catch (err) {
        setSaveError(`Zapis nie powiódł się: ${err.message}`);
      } finally {
        setSavingRow(null);
      }
    },
    [table.id]
  );

  const sortedColumns = useMemo(
    () => (table.columns || []).slice().sort((a, b) => a.index - b.index),
    [table.columns]
  );

  const columns = useMemo(
    () =>
      sortedColumns.map(col => ({
        id: col.name,
        accessorKey: col.name,
        header: col.name,
        meta: { type: col.type },
        enableColumnFilter: true,
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          const val = row.getValue(columnId);
          if (col.type === 'boolean') {
            if (filterValue === 'true') return val === true;
            if (filterValue === 'false') return val === false;
            return true;
          }
          return String(val ?? '').toLowerCase().includes(filterValue.toLowerCase());
        },
        cell: ({ row, getValue }) => (
          <EditableCell
            value={getValue()}
            type={col.type}
            disabled={savingRow === row.original.id}
            onChange={newVal => handleCellChange(row.original.id, col.name, newVal)}
          />
        ),
      })),
    [sortedColumns, savingRow, handleCellChange]
  );

  const reactTable = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  const { pageIndex, pageSize } = reactTable.getState().pagination;
  const filteredCount = reactTable.getFilteredRowModel().rows.length;
  const from = pageIndex * pageSize + 1;
  const to = Math.min(from + pageSize - 1, filteredCount);
  const hasActiveFilters = columnFilters.some(f => f.value);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm">Ładowanie wierszy...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
        <strong>Błąd:</strong> {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <span className="text-sm font-medium text-white">{table.name}</span>
          <span className="text-xs text-gray-500 ml-2">
            {rows.length} wierszy
            {hasActiveFilters && filteredCount !== rows.length && (
              <span className="text-orange-400 ml-1">· {filteredCount} po filtrach</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={() => setColumnFilters([])}
              className="text-xs px-2.5 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded border border-orange-500/30 transition-colors"
            >
              Wyczyść filtry
            </button>
          )}
          <button
            onClick={() => fetchRows()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg border border-gray-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Odśwież
          </button>
        </div>
      </div>

      {truncated && (
        <div className="shrink-0 bg-amber-900/30 border border-amber-700 rounded px-3 py-2 text-amber-300 text-xs">
          Załadowano pierwsze {MAX_ROWS.toLocaleString('pl-PL')} wierszy — tabela jest większa. Sortowanie i filtry działają tylko na załadowanym zakresie.
        </div>
      )}

      {saveError && (
        <div className="shrink-0 bg-red-900/30 border border-red-700 rounded px-3 py-2 text-red-300 text-xs flex items-center justify-between">
          {saveError}
          <button onClick={() => setSaveError(null)} className="ml-2 text-red-400 hover:text-red-200">
            ✕
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto rounded-lg border border-gray-800 flex-1">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-900 sticky top-0 z-10">
            {reactTable.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => {
                  const colType = header.column.columnDef.meta?.type;
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className="text-left px-3 py-2 border-b border-gray-800 align-top min-w-[120px]"
                    >
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 text-gray-300 hover:text-white text-xs font-medium uppercase tracking-wide transition-colors"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span className="text-gray-600 w-3">
                          {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : ''}
                        </span>
                      </button>
                      <div className="mt-1.5">
                        <ColumnFilter column={header.column} type={colType} />
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {reactTable.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-gray-600 text-sm"
                >
                  {hasActiveFilters
                    ? 'Brak wierszy pasujących do filtrów'
                    : 'Ta tabela jest pusta'}
                </td>
              </tr>
            ) : (
              reactTable.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-800/60 hover:bg-gray-900/40 transition-colors ${
                    i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/20'
                  } ${savingRow === row.original.id ? 'opacity-60' : ''}`}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-3 py-2 text-gray-200 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredCount > PAGE_SIZE && (
        <div className="flex items-center justify-between text-xs text-gray-400 shrink-0">
          <span>
            {from}–{to} z {filteredCount}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => reactTable.setPageIndex(0)}
              disabled={!reactTable.getCanPreviousPage()}
              className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-700"
            >
              «
            </button>
            <button
              onClick={() => reactTable.previousPage()}
              disabled={!reactTable.getCanPreviousPage()}
              className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-700"
            >
              ‹
            </button>
            <span className="px-3">
              {pageIndex + 1} / {reactTable.getPageCount()}
            </span>
            <button
              onClick={() => reactTable.nextPage()}
              disabled={!reactTable.getCanNextPage()}
              className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-700"
            >
              ›
            </button>
            <button
              onClick={() => reactTable.setPageIndex(reactTable.getPageCount() - 1)}
              disabled={!reactTable.getCanNextPage()}
              className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-700"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ColumnFilter({ column, type }) {
  const value = column.getFilterValue() ?? '';

  if (type === 'boolean') {
    return (
      <select
        value={value}
        onChange={e => column.setFilterValue(e.target.value || undefined)}
        className="w-full bg-gray-800 border border-gray-700 text-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
      >
        <option value="">Wszystkie</option>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  return (
    <input
      value={value}
      onChange={e => column.setFilterValue(e.target.value || undefined)}
      placeholder="Filtruj..."
      className="w-full bg-gray-800 border border-gray-700 text-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-gray-600"
    />
  );
}
