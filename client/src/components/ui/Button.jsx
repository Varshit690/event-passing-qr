import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export const Button = React.forwardRef(
  ({ className, variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]';
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-base gap-2.5 font-semibold',
    };

    const variantStyles = {
      gradient: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
      'gradient-cyan': 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
      primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
      secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200',
      outline: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400',
      ghost: 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100',
      danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
