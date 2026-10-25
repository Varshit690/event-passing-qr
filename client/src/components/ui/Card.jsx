import React from 'react';
import { cn } from '../../utils/cn';

export const Card = React.forwardRef(
  ({ className, hoverable = false, glass = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-200 bg-white border border-slate-200 shadow-sm text-slate-900',
          hoverable && 'hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = ({ className, children, ...props }) => (
  <div className={cn('p-5 sm:p-6 pb-3', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }) => (
  <h3 className={cn('text-lg font-bold tracking-tight text-slate-900', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className, children, ...props }) => (
  <p className={cn('text-sm text-slate-500 mt-1', className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className, children, ...props }) => (
  <div className={cn('p-5 sm:p-6 pt-0', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }) => (
  <div className={cn('p-5 sm:p-6 pt-0 flex items-center', className)} {...props}>
    {children}
  </div>
);
