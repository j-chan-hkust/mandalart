import { Monitor, Moon, Sun } from 'lucide-react';
import { themes } from '../themes';
import { Button } from './ui/button';

export function ThemePicker({ value, onChange, editing }: { value: string; onChange: (id: string) => void; editing: boolean }) {
  return <div className="theme-picker" role="group" aria-label="Appearance">
    <Button variant="ghost" className="theme-mode" aria-pressed={value === 'system'} title="Follow system appearance" onMouseDown={event => { if (editing) event.preventDefault(); }} onClick={() => onChange('system')}><Monitor size={13}/>System</Button>
    {themes.map(theme => <Button key={theme.id} variant="ghost" className="theme-mode" aria-pressed={value === theme.id} title={theme.name} onMouseDown={event => { if (editing) event.preventDefault(); }} onClick={() => onChange(theme.id)}>
      {theme.mode === 'light' ? <Sun size={13}/> : <Moon size={13}/>}{theme.mode === 'light' ? 'Light' : 'Dark'}
    </Button>)}
  </div>;
}
