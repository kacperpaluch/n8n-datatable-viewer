import { useState, useRef, useEffect } from 'react';
import { PencilIcon, ExternalLinkIcon } from './icons.jsx';

export default function EditableCell({ value, type, onChange, disabled }) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? '');
  const [invalid, setInvalid] = useState(false);
  const [hovered, setHovered] = useState(false);
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
        aria-pressed={!!value}
        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none"
        style={{
          background: value ? 'var(--accent)' : '#d4d4d4',
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: value ? 'translateX(18px)' : 'translateX(2px)' }}
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
        setEditing(false);
        setInvalid(false);
        onChange(null);
        return;
      }
      const n = Number(trimmed);
      if (Number.isNaN(n)) {
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

  const isUrl =
    type === 'string' &&
    typeof value === 'string' &&
    /^https?:\/\//i.test(value.trim());

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
        className="w-full min-w-[100px] rounded-md text-sm focus:outline-none transition-colors"
        style={{
          background: '#fff',
          border: invalid ? '1px solid #dc2626' : '1px solid var(--accent)',
          color: 'var(--text-primary)',
          padding: '4px 8px',
          textAlign: type === 'number' ? 'right' : 'left',
          boxShadow: invalid
            ? '0 0 0 3px rgba(220, 38, 38, 0.1)'
            : '0 0 0 3px var(--accent-light)',
          fontFamily: 'inherit',
        }}
      />
    );
  }

  if (isUrl) {
    return (
      <div
        className="flex items-center gap-1 min-h-[24px] py-0.5"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          title={value}
          className="truncate min-w-0 flex-1 flex items-center gap-1 transition-colors"
          style={{ color: 'var(--accent)' }}
        >
          <span className="truncate">{value}</span>
          <ExternalLinkIcon size={11} className="shrink-0 opacity-60" />
        </a>
        {!disabled && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="Edytuj"
            className="shrink-0 p-0.5 rounded transition-all"
            style={{
              color: 'var(--text-muted)',
              opacity: hovered ? 1 : 0,
              background: hovered ? 'var(--bg-muted)' : 'transparent',
            }}
          >
            <PencilIcon size={11} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => !disabled && setEditing(true)}
      title={disabled ? undefined : displayValue ?? 'Kliknij aby edytować'}
      className="group/cell relative min-h-[24px] rounded-md px-1.5 -mx-1.5 py-0.5 truncate transition-colors"
      style={{
        cursor: disabled ? 'not-allowed' : 'text',
        opacity: disabled ? 0.4 : 1,
        color: 'var(--text-primary)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {displayValue ?? (
        <span style={{ color: 'var(--text-muted)' }} className="select-none">
          —
        </span>
      )}
      {!disabled && (
        <span
          className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4 rounded-sm transition-opacity pointer-events-none"
          style={{
            color: 'var(--text-muted)',
            opacity: hovered ? 1 : 0,
          }}
        >
          <PencilIcon size={11} />
        </span>
      )}
    </div>
  );
}
