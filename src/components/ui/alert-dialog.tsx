import * as Primitive from '@radix-ui/react-alert-dialog';
import type { ComponentProps } from 'react';
export const AlertDialog = Primitive.Root;
export const AlertDialogTrigger = Primitive.Trigger;
export const AlertDialogTitle = Primitive.Title;
export const AlertDialogDescription = Primitive.Description;
export const AlertDialogCancel = Primitive.Cancel;
export function AlertDialogContent(props: ComponentProps<typeof Primitive.Content>) {
  return <Primitive.Portal><Primitive.Overlay className="dialog-overlay" /><Primitive.Content className="dialog-content" {...props} /></Primitive.Portal>;
}
