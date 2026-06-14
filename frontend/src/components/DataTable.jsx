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

  // Domyślne szerokości kolumn wg typu; kolumny ze stringami wykrytymi jako URL
  // dostają więcej miejsca, bo adresy są długie. Użytkownik może je dowolnie rozciągnąć.
  const columnSizes = useMemo(() => {
    const sizes = {};
    for (const col of sortedColumns) {
      if (col.type === 'number') sizes[col.name] = 110;
      else if (col.type === 'boolean') sizes[col.name] = 90;
      else if (col.type === 'date') sizes[col.name] = 160;
      else {
        const sample = rows
          .slice(0, 20)
          .map(r => r[col.name])
          .filter(v => typeof v === 'string' && v !== '');
        const urlish =
          sample.length > 0 &&
          sample.filter(v => /^https?:\/\//i.test(v)).length > sample.length / 2;
        sizes[col.name] = urlish ? 380 : 200;
      }
    }
    return sizes;
  }, [sortedColumns, rows]);

  const columns = useMemo(
    () =>
      sortedColumns.map(col => ({
        id: col.name,
        accessorKey: col.name,
        header: col.name,
        size: columnSizes[col.name],
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
    [sortedColumns, columnSizes, savingRow, handleCellChange]
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
    columnResizeMode: 'onChange',
    defaultColumn: { minSize: 80, maxSize: 1200 },
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
      <div className="flex items-start gap-3 bg-red-950/40 border border-red-800/60 rounded-lg p-4 text-sm">
        <svg className="w-5 h-5 shrink-0 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <div className="text-red-300">
          <strong className="font-semibold text-red-200">Błąd:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-white tracking-tight">{table.name}</span>
          <span className="text-xs text-gray-500 tabular">
            {rows.length.toLocaleString('pl-PL')} wierszy
            {hasActiveFilters && filteredCount !== rows.length && (
              <span className="text-orange-400 ml-1">
                · {filteredCount.toLocaleString('pl-PL')} po filtrach
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={() => setColumnFilters([])}
              className="text-xs px-2.5 py-1.5 bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 rounded-lg border border-orange-500/30 transition-colors"
            >
              Wyczyść filtry
            </button>
          )}
          <button
            onClick={() => fetchRows()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 active:bg-gray-700/80 text-gray-300 hover:text-white text-xs rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
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
      <div className="overflow-auto rounded-lg border border-gray-800 flex-1 bg-gray-950/40">
        <table
          className="text-sm border-collapse table-fixed min-w-full"
          style={{ width: reactTable.getTotalSize() }}
        >
          <thead className="bg-gray-900 sticky top-0 z-10 shadow-header-scroll">
            {reactTable.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => {
                  const colType = header.column.columnDef.meta?.type;
                  const sorted = header.column.getIsSorted();
                  const numeric = colType === 'number';
                  return (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="relative px-3 py-2 border-b border-gray-800 align-top"
                    >
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className={`group flex items-center gap-1.5 w-full text-xs font-semibold uppercase tracking-wide transition-colors ${
                          numeric ? 'justify-end flex-row-reverse' : ''
                        } ${sorted ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        title="Sortuj"
                      >
                        <TypeBadge type={colType} />
                        <span className="truncate">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        <SortIcon dir={sorted} />
                      </button>
                      <div className="mt-1.5">
                        <ColumnFilter column={header.column} type={colType} />
                      </div>
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onClick={e => e.stopPropagation()}
                          title="Przeciągnij, aby zmienić szerokość"
                          className={`absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none touch-none transition-colors ${
                            header.column.getIsResizing()
                              ? 'bg-orange-500'
                              : 'bg-transparent hover:bg-orange-500/40'
                          }`}
                        />
                      )}
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
                  className="px-4 py-16 text-center text-gray-600 text-sm"
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
                  className={`border-b border-gray-800/60 hover:bg-gray-800/40 transition-colors ${
                    i % 2 === 0 ? 'bg-transparent' : 'bg-gray-900/30'
                  } ${savingRow === row.original.id ? 'opacity-60' : ''}`}
                >
                  {row.getVisibleCells().map(cell => {
                    const numeric = cell.column.columnDef.meta?.type === 'number';
                    return (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className={`px-3 py-2 text-gray-200 align-middle overflow-hidden ${
                          numeric ? 'text-right tabular' : ''
                        }`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredCount > PAGE_SIZE && (
        <div className="flex items-center justify-between text-xs text-gray-400 shrink-0">
          <span className="tabular">
            {from}–{to} z {filteredCount.toLocaleString('pl-PL')}
          </span>
          <div className="flex items-center gap-1">
            <PageButton
              onClick={() => reactTable.setPageIndex(0)}
              disabled={!reactTable.getCanPreviousPage()}
              label="Pierwsza strona"
            >
              «
            </PageButton>
            <PageButton
              onClick={() => reactTable.previousPage()}
              disabled={!reactTable.getCanPreviousPage()}
              label="Poprzednia strona"
            >
              ‹
            </PageButton>
            <span className="px-3 tabular text-gray-300">
              {pageIndex + 1} / {reactTable.getPageCount()}
            </span>
            <PageButton
              onClick={() => reactTable.nextPage()}
              disabled={!reactTable.getCanNextPage()}
              label="Następna strona"
            >
              ›
            </PageButton>
            <PageButton
              onClick={() => reactTable.setPageIndex(reactTable.getPageCount() - 1)}
              disabled={!reactTable.getCanNextPage()}
              label="Ostatnia strona"
            >
              »
            </PageButton>
          </div>
        </div>
      )}
    </div>
  );
}

function PageButton({ onClick, disabled, label, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-800 border border-gray-700 hover:border-gray-600 transition-colors leading-none"
    >
      {children}
    </button>
  );
}

const TYPE_META = {
  string: { glyph: 'Aa', title: 'tekst' },
  number: { glyph: '123', title: 'liczba' },
  boolean: { glyph: '0/1', title: 'wartość logiczna' },
  date: { glyph: 'cal', title: 'data' },
};

function TypeBadge({ type }) {
  const meta = TYPE_META[type];
  if (!meta) return null;
  return (
    <span
      title={meta.title}
      className="shrink-0 inline-flex items-center justify-center px-1 h-4 min-w-[1.25rem] rounded bg-gray-800 border border-gray-700 text-[9px] font-mono font-medium text-gray-500 normal-case tracking-normal group-hover:text-gray-400"
    >
      {meta.glyph}
    </span>
  );
}

function SortIcon({ dir }) {
  return (
    <svg
      className={`shrink-0 w-3 h-3 transition-opacity ${
        dir ? 'opacity-100 text-orange-400' : 'opacity-0 group-hover:opacity-50'
      }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {dir === 'desc' ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      )}
    </svg>
  );
}

function ColumnFilter({ column, type }) {
  const value = column.getFilterValue() ?? '';

  if (type === 'boolean') {
    return (
      <select
        value={value}
        onChange={e => column.setFilterValue(e.target.value || undefined)}
        className="w-full bg-gray-800/80 border border-gray-700 text-gray-300 rounded-md px-1.5 py-1 text-xs font-normal normal-case tracking-normal focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
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
      placeholder="Filtruj…"
      className="w-full bg-gray-800/80 border border-gray-700 text-gray-300 rounded-md px-2 py-1 text-xs font-normal normal-case tracking-normal focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 placeholder-gray-600"
    />
  );
}
