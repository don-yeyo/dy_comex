import React, { useRef, useCallback } from 'react';
import { Bold, Italic, Underline, Palette } from 'lucide-react';

/**
 * Editor de texto enriquecido básico (WYSIWYG).
 * Basado en contentEditable + execCommand.
 * Props:
 *   value: string (HTML)
 *   onChange: (html: string) => void
 *   placeholder: string
 *   minHeight: number (default: 120 = ~5 líneas)
 */

const PRESET_COLORS = ['#0d2c5c', '#e40521', '#10b981', '#f59e0b', '#6366f1'];

export default function RichTextEditor({ value, onChange, placeholder = 'Escribí aquí...', minHeight = 120 }) {
  const editorRef = useRef(null);
  const colorPickerRef = useRef(null);

  const exec = useCallback((command, val = null) => {
    document.execCommand(command, false, val);
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  }, [onChange]);

  const handleInput = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleColorChange = (color) => {
    exec('foreColor', color);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const isEmpty = !value || value === '<br>' || value === '<div><br></div>';

  return (
    <div className="rich-editor">
      <div className="rich-toolbar">
        <button type="button" className="rich-toolbar-btn" onClick={() => exec('bold')} title="Negrita (Ctrl+B)">
          <Bold size={14} />
        </button>
        <button type="button" className="rich-toolbar-btn" onClick={() => exec('italic')} title="Cursiva (Ctrl+I)">
          <Italic size={14} />
        </button>
        <button type="button" className="rich-toolbar-btn" onClick={() => exec('underline')} title="Subrayado (Ctrl+U)">
          <Underline size={14} />
        </button>
        <div className="rich-color-group">
          <button type="button" className="rich-toolbar-btn" onClick={() => colorPickerRef.current?.classList.toggle('open')} title="Color de texto">
            <Palette size={14} />
          </button>
          <div className="rich-color-picker" ref={colorPickerRef}>
            {PRESET_COLORS.map(c => (
              <button key={c} type="button" className="rich-color-swatch" style={{ background: c }} onClick={() => { handleColorChange(c); colorPickerRef.current?.classList.remove('open'); }} title={c} />
            ))}
          </div>
        </div>
      </div>
      <div
        ref={editorRef}
        className={`rich-editor-area ${isEmpty ? 'empty' : ''}`}
        contentEditable
        data-placeholder={placeholder}
        onInput={handleInput}
        onPaste={handlePaste}
        style={{ minHeight }}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        suppressContentEditableWarning
      />
    </div>
  );
}
