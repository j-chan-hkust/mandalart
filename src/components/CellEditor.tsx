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
  const measureRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    const frame = frameRef.current;
    const measure = measureRef.current;
    if (!textarea || !frame || !measure) return;
    const resize = () => {
      const frameStyle = getComputedStyle(frame);
      const available = frame.clientHeight - parseFloat(frameStyle.paddingTop) - parseFloat(frameStyle.paddingBottom);
      // Measure the same naturally wrapped line boxes as display text.
      // scrollHeight rounds fractional line heights and can shift the caret/text.
      textarea.style.overflowY = 'hidden';
      measure.style.width = `${textarea.getBoundingClientRect().width}px`;
      const contentHeight = measure.getBoundingClientRect().height;
      textarea.style.height = `${Math.max(0, Math.min(contentHeight, available))}px`;
      textarea.style.overflowY = contentHeight > available ? 'auto' : 'hidden';
      if (contentHeight <= available) textarea.scrollTop = 0;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(frame);
    let active = true;
    void document.fonts.ready.then(() => { if (active) resize(); });
    return () => { active = false; observer.disconnect(); };
  }, [textareaRef, value, style.width, style.height]);

  return <div ref={frameRef} className={`cell-editor-frame ${mainGoal ? 'main-editor' : ''}`} style={style}>
    <span ref={measureRef} className="cell-editor-measure" aria-hidden="true">{value || 'Write your idea…'}{'\u200b'}</span>
    <textarea ref={textareaRef} className="cell-editor" aria-label={label} value={value} onChange={event => onChange(event.target.value)} spellCheck placeholder="Write your idea…" />
  </div>;
}
