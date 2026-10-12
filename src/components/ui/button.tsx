import type { ComponentProps } from 'react';
// shadcn-style owned component: accessible native control, variants, and class override.
export function Button({ className = '', variant = 'default', ...props }: ComponentProps<'button'> & { variant?: 'default' | 'outline' | 'ghost' | 'destructive' }) {
  return <button className={`button button-${variant} ${className}`} {...props} />;
}
