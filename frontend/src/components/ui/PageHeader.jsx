import React from 'react';

export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-[1.65rem] font-bold text-textPrimary tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-textSecondary mt-1 max-w-xl">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0">{children}</div>
      )}
    </div>
  );
}
