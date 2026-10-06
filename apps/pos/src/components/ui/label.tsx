import * as React from 'react';
import { cn } from '../../lib/utils';

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      className={cn(
        "mb-2 text-sm font-medium text-paper-white",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label };