import React from 'react';
import { Button } from './Button';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, breadcrumb }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1 mb-1">
          {breadcrumb.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-slate-300 text-xs">/</span>}
              <span className={`text-xs ${index === breadcrumb.length - 1 ? 'text-slate-500' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </React.Fragment>
          ))}
        </nav>
      )}
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {action && <div className="flex items-center gap-2">{action}</div>}
  </div>
);

