import { useState, useEffect } from 'react';
import DataTable from './components/DataTable.jsx';
import {
  DatabaseIcon,
  ChevronDownIcon,
  AlertTriangleIcon,
  TableIcon,
} from './components/icons.jsx';

const TABLES_LIMIT = 250;

const DEFAULT_TABLE_KEY = 'n8n-dtv:defaultTable';

export default function App() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [truncated, setTruncated] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [webhookTables, setWebhookTables] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(`/n8n-api/data-tables?limit=${TABLES_LIMIT}`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      }),
      fetch('/webhooks').then(r => r.ok ? r.json() : { tables: [] }).catch(() => ({ tables: [] })),
    ])
      .then(([data, wh]) => {
        const list = data.data || [];
        setTables(list);
        setTruncated(list.length >= TABLES_LIMIT);
        setWebhookTables(wh.tables || []);
        setLoading(false);
        // Restore default selection — localStorage first, else nothing selected
        const savedId = localStorage.getItem(DEFAULT_TABLE_KEY);
        const found = savedId && list.find(t => t.id === savedId);
        if (found) setSelectedTable(found);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const selectTable = (table) => {
    setSelectedTable(table);
    if (table) localStorage.setItem(DEFAULT_TABLE_KEY, table.id);
    else localStorage.removeItem(DEFAULT_TABLE_KEY);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col font-body"
      style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}
    >
      <header
        className={`sticky top-0 z-30 bg-white transition-shadow ${
          scrolled ? 'shadow-header-scroll' : ''
        }`}
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 2px 6px rgba(94, 168, 50, 0.25)',
              }}
            >
              <DatabaseIcon size={18} className="text-white" strokeWidth={2.25} />
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className="font-display text-[19px] font-extrabold leading-none"
                style={{ color: 'var(--text-primary)' }}
              >
                DataTable Viewer
              </span>
              <span
                className="text-[11px] font-medium uppercase tracking-wider hidden sm:inline"
                style={{ color: 'var(--text-muted)' }}
              >
                for n8n
              </span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {!loading && !error && (
              <>
                <span
                  className="text-xs tabular hidden md:inline"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {tables.length} {tables.length === 1 ? 'tabela' : 'tabel'}
                </span>
                <div className="relative">
                  <select
                    className="appearance-none bg-white text-sm font-medium rounded-md pl-3 pr-9 py-2 cursor-pointer transition-all"
                    style={{
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      minWidth: '260px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    }}
                    value={selectedTable?.id || ''}
                    onChange={e =>
                      selectTable(tables.find(t => t.id === e.target.value) || null)
                    }
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <option value="">— wybierz DataTable —</option>
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon
                    size={16}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-6 max-w-[1400px] w-full mx-auto overflow-hidden">
        {loading && (
          <div
            className="flex items-center justify-center h-64"
            style={{ color: 'var(--text-muted)' }}
          >
            <div className="text-center">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-3 animate-spin"
                style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
              />
              <p className="text-sm">Ładowanie tabel…</p>
            </div>
          </div>
        )}

        {error && (
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
              <strong className="font-semibold">Błąd połączenia z n8n:</strong> {error}
              <p className="mt-1" style={{ color: '#b91c1c' }}>
                Sprawdź zmienne środowiskowe N8N_URL i N8N_API_KEY.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && !selectedTable && (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center max-w-sm">
              <div
                className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'var(--accent-light)',
                  border: '1px solid var(--border)',
                }}
              >
                <TableIcon
                  size={28}
                  strokeWidth={1.5}
                  style={{ color: 'var(--accent)' }}
                />
              </div>
              <h2
                className="font-display text-2xl font-bold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Wybierz DataTable
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Skorzystaj z listy w prawym górnym rogu, aby otworzyć tabelę i
                przeglądać lub edytować wiersze.
              </p>
            </div>
          </div>
        )}

        {truncated && !loading && !error && (
          <div
            className="mb-3 rounded-md px-3 py-2 text-xs flex items-start gap-2"
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#92400e',
            }}
          >
            <AlertTriangleIcon size={14} className="shrink-0 mt-0.5" />
            Lista tabel została obcięta do {TABLES_LIMIT} pozycji — niektóre tabele
            mogą nie być widoczne.
          </div>
        )}

        {selectedTable && (
          <DataTable
            key={selectedTable.id}
            table={selectedTable}
            hasWebhook={webhookTables.includes(selectedTable.name)}
          />
        )}
      </main>
    </div>
  );
}
