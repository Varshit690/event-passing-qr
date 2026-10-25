import React from 'react';
import { cn } from '../../utils/cn';

export const Badge = ({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
  };

  const variantStyles = {
    primary: 'bg-blue-50 text-blue-700 border border-blue-200',
    secondary: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    outline: 'bg-white text-slate-700 border border-slate-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-medium transition-colors',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
