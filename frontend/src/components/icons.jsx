// Lucide-style inline SVG icons. Stroke-based, 1.75px width — matches Lucide defaults.
// All icons inherit `currentColor`. Default size: 16px. Override via className.

function base({ size = 16, className = '', children, strokeWidth = 1.75 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const DatabaseIcon = (p) =>
  base({
    ...p,
    children: (
      <>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
        <path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6" />
      </>
    ),
  });

export const ChevronDownIcon = (p) =>
  base({ ...p, children: <path d="m6 9 6 6 6-6" /> });

export const ChevronLeftIcon = (p) =>
  base({ ...p, children: <path d="m15 18-6-6 6-6" /> });

export const ChevronRightIcon = (p) =>
  base({ ...p, children: <path d="m9 18 6-6-6-6" /> });

export const ChevronsLeftIcon = (p) =>
  base({
    ...p,
    children: (
      <>
        <path d="m11 17-5-5 5-5" />
        <path d="m18 17-5-5 5-5" />
      </>
    ),
  });

export const ChevronsRightIcon = (p) =>
  base({
    ...p,
    children: (
      <>
        <path d="m6 17 5-5-5-5" />
        <path d="m13 17 5-5-5-5" />
      </>
    ),
  });

export const RefreshIcon = (p) =>
  base({
    ...p,
    children: (
      <>
        <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
        <path d="M21 3v5h-5" />
      </>
    ),
  });

export const AlertTriangleIcon = (p) =>
  base({
    ...p,
    children: (
      <>
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <circle cx="12" cy="17" r="0.5" fill="currentColor" />
      </>
    ),
  });

export const SearchIcon = (p) =>
  base({
    ...p,
    children: (
      <>
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    ),
  });


export const PencilIcon = (p) =>
  base({
    ...p,
    children: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </>
    ),
  });

export const XIcon = (p) =>
  base({
    ...p,
    children: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
  });

export const ArrowUpIcon = (p) =>
  base({ ...p, children: <path d="M12 19V5M5 12l7-7 7 7" /> });

export const ArrowDownIcon = (p) =>
  base({ ...p, children: <path d="M12 5v14M19 12l-7 7-7-7" /> });

export const ArrowUpDownIcon = (p) =>
  base({
    ...p,
    children: (
      <>
        <path d="M7 4v16" />
        <path d="M3 8l4-4 4 4" />
        <path d="M17 20V4" />
        <path d="M21 16l-4 4-4-4" />
      </>
    ),
  });

export const ExternalLinkIcon = (p) =>
  base({
    ...p,
    children: (
      <>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </>
    ),
  });

export const TableIcon = (p) =>
  base({
    ...p,
    children: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
      </>
    ),
  });

export const HashIcon = (p) =>
  base({
    ...p,
    children: (
      <>
        <line x1="4" y1="9" x2="20" y2="9" />
        <line x1="4" y1="15" x2="20" y2="15" />
        <line x1="10" y1="3" x2="8" y2="21" />
        <line x1="16" y1="3" x2="14" y2="21" />
      </>
    ),
  });

export const TypeIcon = (p) =>
  base({
    ...p,
    children: (
      <>
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </>
    ),
  });

export const CalendarIcon = (p) =>
  base({
    ...p,
    children: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
  });

export const ToggleLeftIcon = (p) =>
  base({
    ...p,
    children: (
      <>
        <rect x="1" y="5" width="22" height="14" rx="7" />
        <circle cx="8" cy="12" r="3" fill="currentColor" />
      </>
    ),
  });

export const ZapIcon = (p) =>
  base({
    ...p,
    children: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  });

export const ShuffleIcon = (p) =>
  base({
    ...p,
    children: (
      <>
        <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22" />
        <path d="m18 2 4 4-4 4" />
        <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
        <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
        <path d="m18 14 4 4-4 4" />
      </>
    ),
  });
