import { useState, useEffect } from 'react';
import DataTable from './components/DataTable.jsx';

const TABLES_LIMIT = 250;

export default function App() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    fetch(`/n8n-api/data-tables?limit=${TABLES_LIMIT}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      })
      .then(data => {
        const list = data.data || [];
        setTables(list);
        setTruncated(list.length >= TABLES_LIMIT);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold leading-none">n8</span>
          </div>
          <h1 className="text-base font-semibold text-white">DataTable Viewer</h1>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {!loading && !error && (
            <>
              <span className="text-xs text-gray-500">
                {tables.length} {tables.length === 1 ? 'table' : 'tables'}
              </span>
              <select
                className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[260px]"
                value={selectedTable?.id || ''}
                onChange={e =>
                  setSelectedTable(tables.find(t => t.id === e.target.value) || null)
                }
              >
                <option value="">— wybierz DataTable —</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm">Ładowanie tabel...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
            <strong className="font-semibold">Błąd połączenia z n8n:</strong> {error}
            <p className="mt-1 text-red-400/70">
              Sprawdź zmienne środowiskowe N8N_URL i N8N_API_KEY.
            </p>
          </div>
        )}

        {!loading && !error && !selectedTable && (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 10h18M3 6h18M3 14h18M3 18h18"
                />
              </svg>
              <p className="text-base">Wybierz DataTable z listy powyżej</p>
            </div>
          </div>
        )}

        {truncated && !loading && !error && (
          <div className="mb-3 bg-amber-900/30 border border-amber-700 rounded-lg px-3 py-2 text-amber-300 text-xs">
            Lista tabel została obcięta do {TABLES_LIMIT} pozycji — niektóre tabele mogą nie być widoczne.
          </div>
        )}

        {selectedTable && <DataTable key={selectedTable.id} table={selectedTable} />}
      </main>
    </div>
  );
}
