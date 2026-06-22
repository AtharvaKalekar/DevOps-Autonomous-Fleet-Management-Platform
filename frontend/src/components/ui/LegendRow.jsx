import React from 'react';

const DEFAULT_ITEMS = [
  { label: 'Active', color: '#16a34a' },
  { label: 'Idle', color: '#ca8a04' },
  { label: 'Maint.', color: '#ea580c' },
  { label: 'Offline', color: '#dc2626' },
];

export default function LegendRow({ items = DEFAULT_ITEMS, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 ${className}`}>
      {items.map(({ label, color }) => (
        <span key={label} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-textSecondary whitespace-nowrap">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}
