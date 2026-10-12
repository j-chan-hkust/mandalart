import * as Primitive from '@radix-ui/react-toggle-group';
import type { ComponentProps } from 'react';
export function ToggleGroup(props: ComponentProps<typeof Primitive.Root>) { return <Primitive.Root className="toggle-group" {...props} />; }
export function ToggleGroupItem(props: ComponentProps<typeof Primitive.Item>) { return <Primitive.Item className="toggle-item" {...props} />; }
