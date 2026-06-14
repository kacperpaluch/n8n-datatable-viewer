import { useState, useRef, useEffect } from 'react';

export default function EditableCell({ value, type, onChange, disabled }) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? '');
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select?.();
    }
  }, [editing]);

  if (type === 'boolean') {
    return (
      <button
        type="button"
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        title={String(value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
          value ? 'bg-orange-500' : 'bg-gray-600'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            value ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    );
  }

  const commit = () => {
    const trimmed = typeof localValue === 'string' ? localValue.trim() : localValue;
    const original = value ?? '';
    if (String(trimmed) === String(original)) {
      setEditing(false);
      setInvalid(false);
      return;
    }

    if (type === 'number') {
      if (trimmed === '') {
        // Wyczyszczenie liczby = brak wartości, a nie 0
        setEditing(false);
        setInvalid(false);
        onChange(null);
        return;
      }
      const n = Number(trimmed);
      if (Number.isNaN(n)) {
        // Nieprawidłowa liczba — sygnalizuj błąd zamiast cicho wysyłać starą wartość
        setInvalid(true);
        requestAnimationFrame(() => inputRef.current?.focus());
        return;
      }
      setEditing(false);
      setInvalid(false);
      onChange(n);
      return;
    }

    setEditing(false);
    setInvalid(false);
    onChange(trimmed);
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter') inputRef.current?.blur();
    if (e.key === 'Escape') {
      setLocalValue(value ?? '');
      setInvalid(false);
      setEditing(false);
    }
  };

  const displayValue =
    value === null || value === undefined || value === '' ? null : String(value);

  // type="date" przyjmuje tylko YYYY-MM-DD i cicho gubi czas/strefę przy datetime.
  // Picker tylko dla czystych dat; pełne timestampy edytujemy jako tekst (round-trip bez korupcji).
  const isPlainDate = type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''));
  const inputType =
    type === 'number' ? 'number' : type === 'date' && isPlainDate ? 'date' : 'text';

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={localValue}
        onChange={e => {
          setLocalValue(e.target.value);
          if (invalid) setInvalid(false);
        }}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        type={inputType}
        title={invalid ? 'Nieprawidłowa liczba' : undefined}
        className={`w-full min-w-[100px] bg-gray-800 border text-white rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 ${
          type === 'number' ? 'text-right tabular' : ''
        } ${
          invalid
            ? 'border-red-500 focus:ring-red-500/40'
            : 'border-orange-500 focus:ring-orange-500/40'
        }`}
      />
    );
  }

  return (
    <div
      onClick={() => !disabled && setEditing(true)}
      title={disabled ? undefined : 'Kliknij aby edytować'}
      className={`group/cell relative min-h-[24px] rounded-md px-1.5 -mx-1.5 py-0.5 truncate max-w-[280px] transition-colors ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'cursor-text hover:bg-gray-800 hover:ring-1 hover:ring-inset hover:ring-gray-700'
      }`}
    >
      {displayValue ?? <span className="text-gray-600 select-none">—</span>}
      {!disabled && (
        <svg
          className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 opacity-0 group-hover/cell:opacity-100 transition-opacity bg-gray-800 rounded-sm"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      )}
    </div>
  );
}
