import { useLayoutEffect, useRef } from 'react';
import type { CSSProperties, RefObject } from 'react';

interface CellEditorProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  style: CSSProperties;
  value: string;
  label: string;
  mainGoal: boolean;
  onChange: (value: string) => void;
}

export function CellEditor({ textareaRef, style, value, label, mainGoal, onChange }: CellEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    const frame = frameRef.current;
    if (!textarea || !frame) return;
    const resize = () => {
      const frameStyle = getComputedStyle(frame);
      const available = frame.clientHeight - parseFloat(frameStyle.paddingTop) - parseFloat(frameStyle.paddingBottom);
      // A content-sized textarea can share the display cell's vertical centering.
      textarea.style.height = '0px';
      textarea.style.overflowY = 'hidden';
      const contentHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.max(0, Math.min(contentHeight, available))}px`;
      textarea.style.overflowY = contentHeight > available ? 'auto' : 'hidden';
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(frame);
    let active = true;
    void document.fonts.ready.then(() => { if (active) resize(); });
    return () => { active = false; observer.disconnect(); };
  }, [textareaRef, value, style.width, style.height]);

  return <div ref={frameRef} className={`cell-editor-frame ${mainGoal ? 'main-editor' : ''}`} style={style}>
    <textarea ref={textareaRef} className="cell-editor" aria-label={label} value={value} onChange={event => onChange(event.target.value)} spellCheck placeholder="Write your idea…" />
  </div>;
}
