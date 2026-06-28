import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import EditableCell from './EditableCell.jsx';
import {
  RefreshIcon,
  AlertTriangleIcon,
  XIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
  SearchIcon,
  TypeIcon,
  HashIcon,
  CalendarIcon,
  ToggleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ChevronDownIcon,
  ZapIcon,
  ShuffleIcon,
} from './icons.jsx';

const PAGE_SIZE = 50;
const MAX_ROWS = 10000;

export default function DataTable({ table, hasWebhook = false }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [truncated, setTruncated] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [savingRow, setSavingRow] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [webhookBusy, setWebhookBusy] = useState(false);
  const [webhookNotice, setWebhookNotice] = useState(null); // {type: 'ok'|'err', msg}
  const abortRef = useRef(null);
  const webhookNoticeTimer = useRef(null);

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

  const refresh = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    fetchRows(controller.signal);
  }, [fetchRows]);

  // Losowa kolejność wyświetlania (czysto w przeglądarce, bez zapisu do n8n).
  // Tasuje obecny zbiór wierszy; czyści sortowanie, by układ był widoczny.
  const shuffleRows = useCallback(() => {
    setSorting([]);
    setRows(prev => {
      const next = prev.slice();
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
  }, []);

  const triggerWebhook = useCallback(async () => {
    setWebhookBusy(true);
    setWebhookNotice(null);
    try {
      const res = await fetch(`/trigger-webhook/${encodeURIComponent(table.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setWebhookNotice({ type: 'ok', msg: `Webhook wykonany: ${data.body?.status || 'ok'}` });
      refresh();
    } catch (err) {
      setWebhookNotice({ type: 'err', msg: `Webhook nie powiódł się: ${err.message}` });
    } finally {
      setWebhookBusy(false);
      if (webhookNoticeTimer.current) clearTimeout(webhookNoticeTimer.current);
      webhookNoticeTimer.current = setTimeout(() => setWebhookNotice(null), 6000);
    }
  }, [table.name, refresh]);

  useEffect(() => {
    refresh();
    setSorting([]);
    setColumnFilters([]);
    setColumnVisibility({});
    setShowColumnMenu(false);
    setSaveError(null);
    return () => abortRef.current?.abort();
  }, [refresh]);

  const handleCellChange = useCallback(
    async (rowId, columnName, newValue) => {
      const oldValue = rows.find(r => r.id === rowId)?.[columnName];
      setSavingRow(rowId);
      setSaveError(null);
      setRows(prev =>
        prev.map(r => (r.id === rowId ? { ...r, [columnName]: newValue } : r))
      );
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
      } catch (err) {
        setRows(prev =>
          prev.map(r => (r.id === rowId ? { ...r, [columnName]: oldValue } : r))
        );
        setSaveError(`Zapis nie powiódł się: ${err.message}`);
      } finally {
        setSavingRow(null);
      }
    },
    [table.id, rows]
  );

  const sortedColumns = useMemo(
    () => (table.columns || []).slice().sort((a, b) => a.index - b.index),
    [table.columns]
  );

  const columnSizes = useMemo(() => {
    const sizes = {};
    for (const col of sortedColumns) {
      if (col.type === 'number') sizes[col.name] = 120;
      else if (col.type === 'boolean') sizes[col.name] = 92;
      else if (col.type === 'date') sizes[col.name] = 170;
      else {
        const sample = rows
          .slice(0, 20)
          .map(r => r[col.name])
          .filter(v => typeof v === 'string' && v !== '');
        const urlish =
          sample.length > 0 &&
          sample.filter(v => /^https?:\/\//i.test(v)).length > sample.length / 2;
        sizes[col.name] = urlish ? 380 : 220;
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
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
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
      <div
        className="flex items-center justify-center h-64"
        style={{ color: 'var(--text-muted)' }}
      >
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-3 animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
          <p className="text-sm">Ładowanie wierszy…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-start gap-3 rounded-lg p-4 text-sm"
        style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
        }}
      >
        <AlertTriangleIcon
          size={20}
          className="shrink-0 mt-0.5"
          style={{ color: '#dc2626' }}
        />
        <div>
          <strong className="font-semibold">Błąd:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between shrink-0 rounded-lg px-4 py-3"
        style={{
          background: 'var(--bg-page)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex items-baseline gap-2 min-w-0">
          <span
            className="font-display text-lg font-bold truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {table.name}
          </span>
          <span
            className="text-xs tabular shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            {rows.length.toLocaleString('pl-PL')} wierszy
            {hasActiveFilters && filteredCount !== rows.length && (
              <span style={{ color: 'var(--accent)' }} className="ml-1">
                · {filteredCount.toLocaleString('pl-PL')} po filtrach
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasActiveFilters && (
            <button
              onClick={() => setColumnFilters([])}
              className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
              style={{
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                border: '1px solid #d8eec6',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#e3f1d2')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent-light)')}
            >
              Wyczyść filtry
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                background: '#fff',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                if (!showColumnMenu) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              Kolumny
              <ChevronDownIcon size={14} />
            </button>
            {showColumnMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowColumnMenu(false)}
                />
                <div
                  className="absolute right-0 top-full mt-1 z-50 rounded-lg py-1 max-h-80 overflow-auto"
                  style={{
                    background: '#fff',
                    border: '1px solid var(--border)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                    minWidth: '200px',
                  }}
                >
                  {sortedColumns.map(col => (
                    <label
                      key={col.name}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-muted)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <input
                        type="checkbox"
                        checked={reactTable.getColumn(col.name)?.getIsVisible() ?? true}
                        onChange={() => reactTable.getColumn(col.name)?.toggleVisibility()}
                        className="accent-[#5ea832]"
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      <span className="truncate">{col.name}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={shuffleRows}
            disabled={rows.length < 2}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{
              background: '#fff',
              color: 'var(--accent)',
              border: '1px solid #d8eec6',
              opacity: rows.length < 2 ? 0.5 : 1,
              cursor: rows.length < 2 ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => {
              if (rows.length >= 2) e.currentTarget.style.background = 'var(--accent-light)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#fff';
            }}
            title="Losowa kolejność wierszy (tylko widok, bez zapisu)"
          >
            <ShuffleIcon size={14} strokeWidth={2} />
            Pomieszaj
          </button>
          {hasWebhook && (
            <button
              onClick={triggerWebhook}
              disabled={webhookBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                background: webhookBusy ? 'var(--accent-light)' : '#fff',
                color: 'var(--accent)',
                border: '1px solid #d8eec6',
                opacity: webhookBusy ? 0.7 : 1,
                cursor: webhookBusy ? 'wait' : 'pointer',
              }}
              onMouseEnter={e => {
                if (!webhookBusy) e.currentTarget.style.background = 'var(--accent-light)';
              }}
              onMouseLeave={e => {
                if (!webhookBusy) e.currentTarget.style.background = '#fff';
              }}
              title="Uruchom workflow n8n przez webhook"
            >
              {webhookBusy ? (
                <div
                  className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
                />
              ) : (
                <ZapIcon size={14} strokeWidth={2} />
              )}
              n8n webhook
            </button>
          )}
          <button
            onClick={() => refresh()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{
              background: 'var(--text-primary)',
              color: '#fff',
              border: '1px solid var(--text-primary)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <RefreshIcon size={14} strokeWidth={2} />
            Odśwież
          </button>
        </div>
      </div>

      {webhookNotice && (
        <div
          className="shrink-0 rounded-md px-3 py-2 text-xs flex items-center gap-2"
          style={{
            background: webhookNotice.type === 'ok' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${webhookNotice.type === 'ok' ? '#bbf7d0' : '#fecaca'}`,
            color: webhookNotice.type === 'ok' ? '#166534' : '#991b1b',
          }}
        >
          <button onClick={() => setWebhookNotice(null)} className="hover:opacity-70" aria-label="Zamknij">
            <XIcon size={14} />
          </button>
          <span>{webhookNotice.msg}</span>
        </div>
      )}

      {truncated && (
        <div
          className="shrink-0 rounded-md px-3 py-2 text-xs flex items-start gap-2"
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#92400e',
          }}
        >
          <AlertTriangleIcon size={14} className="shrink-0 mt-0.5" />
          Załadowano pierwsze {MAX_ROWS.toLocaleString('pl-PL')} wierszy — tabela
          jest większa. Sortowanie i filtry działają tylko na załadowanym zakresie.
        </div>
      )}

      {saveError && (
        <div
          className="shrink-0 rounded-md px-3 py-2 text-xs flex items-center justify-between"
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
          }}
        >
          <span className="flex items-center gap-2">
            <AlertTriangleIcon size={14} />
            {saveError}
          </span>
          <button
            onClick={() => setSaveError(null)}
            className="ml-2 hover:opacity-70"
            aria-label="Zamknij"
          >
            <XIcon size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <div
        className="overflow-auto rounded-lg flex-1"
        style={{
          background: 'var(--bg-page)',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <table
          className="text-sm border-collapse table-fixed min-w-full"
          style={{ width: reactTable.getTotalSize() }}
        >
          <thead
            className="sticky top-0 z-10"
            style={{
              background: 'var(--bg-page)',
              borderBottom: '1px solid var(--border)',
            }}
          >
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
                      className="relative px-3 py-2.5 align-top"
                    >
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className={`group flex items-center gap-1.5 w-full text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                          numeric ? 'justify-end flex-row-reverse' : ''
                        }`}
                        style={{
                          color: sorted ? 'var(--text-primary)' : 'var(--text-muted)',
                        }}
                        title="Sortuj"
                      >
                        <TypeBadge type={colType} />
                        <span
                          className="truncate"
                          style={{
                            color: sorted ? 'var(--text-primary)' : 'var(--text-secondary)',
                          }}
                        >
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
                          className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none touch-none transition-colors"
                          style={{
                            backgroundColor: header.column.getIsResizing()
                              ? 'var(--accent)'
                              : 'transparent',
                          }}
                          onMouseEnter={e => {
                            if (!header.column.getIsResizing()) {
                              e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (!header.column.getIsResizing()) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
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
                  className="px-4 py-16 text-center text-sm"
                  style={{ color: 'var(--text-muted)' }}
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
                  className="transition-colors"
                  style={{
                    background: i % 2 === 0 ? '#ffffff' : 'var(--bg-muted)',
                    borderBottom: '1px solid var(--border)',
                    opacity: savingRow === row.original.id ? 0.5 : 1,
                  }}
                  onMouseEnter={e => {
                    if (savingRow !== row.original.id) {
                      e.currentTarget.style.background = 'var(--accent-light)';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background =
                      i % 2 === 0 ? '#ffffff' : 'var(--bg-muted)';
                  }}
                >
                  {row.getVisibleCells().map(cell => {
                    const numeric = cell.column.columnDef.meta?.type === 'number';
                    return (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className={`px-3 py-2 align-middle overflow-hidden ${
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
        <div
          className="flex items-center justify-between text-xs shrink-0 rounded-md px-3 py-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span className="tabular">
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              {from}–{to}
            </span>{' '}
            z {filteredCount.toLocaleString('pl-PL')}
          </span>
          <div className="flex items-center gap-1">
            <PageButton
              onClick={() => reactTable.setPageIndex(0)}
              disabled={!reactTable.getCanPreviousPage()}
              label="Pierwsza strona"
            >
              <ChevronsLeftIcon size={14} />
            </PageButton>
            <PageButton
              onClick={() => reactTable.previousPage()}
              disabled={!reactTable.getCanPreviousPage()}
              label="Poprzednia strona"
            >
              <ChevronLeftIcon size={14} />
            </PageButton>
            <span
              className="px-3 tabular"
              style={{ color: 'var(--text-primary)', fontWeight: 500 }}
            >
              {pageIndex + 1} / {reactTable.getPageCount()}
            </span>
            <PageButton
              onClick={() => reactTable.nextPage()}
              disabled={!reactTable.getCanNextPage()}
              label="Następna strona"
            >
              <ChevronRightIcon size={14} />
            </PageButton>
            <PageButton
              onClick={() => reactTable.setPageIndex(reactTable.getPageCount() - 1)}
              disabled={!reactTable.getCanNextPage()}
              label="Ostatnia strona"
            >
              <ChevronsRightIcon size={14} />
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
      className="w-8 h-8 flex items-center justify-center rounded-md transition-all"
      style={{
        background: '#fff',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border)',
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      {children}
    </button>
  );
}

const TYPE_META = {
  string: { Icon: TypeIcon, title: 'tekst' },
  number: { Icon: HashIcon, title: 'liczba' },
  boolean: { Icon: ToggleLeftIcon, title: 'wartość logiczna' },
  date: { Icon: CalendarIcon, title: 'data' },
};

function TypeBadge({ type }) {
  const meta = TYPE_META[type];
  if (!meta) return null;
  const { Icon } = meta;
  return (
    <span
      title={meta.title}
      className="shrink-0 inline-flex items-center justify-center w-4 h-4 rounded"
      style={{
        background: 'var(--bg-muted)',
        color: 'var(--text-muted)',
      }}
    >
      <Icon size={10} strokeWidth={2} />
    </span>
  );
}

function SortIcon({ dir }) {
  if (dir === 'asc') return <ArrowUpIcon size={12} style={{ color: 'var(--accent)' }} />;
  if (dir === 'desc') return <ArrowDownIcon size={12} style={{ color: 'var(--accent)' }} />;
  return (
    <ArrowUpDownIcon
      size={12}
      className="shrink-0 opacity-0 group-hover:opacity-50 transition-opacity"
      style={{ color: 'var(--text-muted)' }}
    />
  );
}

function ColumnFilter({ column, type }) {
  const value = column.getFilterValue() ?? '';

  const inputStyle = {
    background: '#fff',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    width: '100%',
    fontFamily: 'inherit',
  };

  if (type === 'boolean') {
    return (
      <select
        value={value}
        onChange={e => column.setFilterValue(e.target.value || undefined)}
        className="focus:outline-none transition-colors"
        style={inputStyle}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <option value="">Wszystkie</option>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  return (
    <div className="relative">
      <SearchIcon
        size={12}
        className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--text-muted)' }}
      />
      <input
        value={value}
        onChange={e => column.setFilterValue(e.target.value || undefined)}
        placeholder="Filtruj…"
        className="focus:outline-none transition-colors"
        style={{ ...inputStyle, paddingLeft: '24px' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      />
    </div>
  );
}
