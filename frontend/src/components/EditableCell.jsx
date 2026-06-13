import { useState, useRef, useEffect } from 'react';

export default function EditableCell({ value, type, onChange, disabled }) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? '');
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
    setEditing(false);
    const trimmed = typeof localValue === 'string' ? localValue.trim() : localValue;
    const original = value ?? '';
    if (String(trimmed) === String(original)) return;

    let finalValue = trimmed;
    if (type === 'number') {
      const n = Number(trimmed);
      finalValue = isNaN(n) ? original : n;
    }
    onChange(finalValue);
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter') inputRef.current?.blur();
    if (e.key === 'Escape') {
      setLocalValue(value ?? '');
      setEditing(false);
    }
  };

  const displayValue =
    value === null || value === undefined || value === '' ? null : String(value);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
        className="w-full min-w-[100px] bg-gray-800 border border-orange-500 text-white rounded px-2 py-0.5 text-sm focus:outline-none"
      />
    );
  }

  return (
    <div
      onClick={() => !disabled && setEditing(true)}
      title="Kliknij aby edytować"
      className={`min-h-[22px] rounded px-1 -mx-1 truncate max-w-[280px] ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'cursor-text hover:bg-gray-800 hover:ring-1 hover:ring-gray-600'
      }`}
    >
      {displayValue ?? <span className="text-gray-600 select-none">—</span>}
    </div>
  );
}
