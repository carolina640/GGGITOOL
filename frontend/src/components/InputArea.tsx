import { useState, useRef, KeyboardEvent } from 'react'
import './InputArea.css'

interface InputAreaProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export default function InputArea({ onSend, isLoading }: InputAreaProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (value.trim() && !isLoading) {
      onSend(value);
      setValue('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInput = () => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'; }
  };

  const disabled = isLoading;
  const canSend  = value.trim().length > 0 && !isLoading;

  return (
    <div className={`input-zone${disabled ? ' input-zone--loading' : ''}`}>
      <div className="input-pill">
        <textarea
          ref={textareaRef}
          className="itext"
          placeholder={disabled ? 'Verde GGGI está consultando los documentos...' : 'Escribe tu consulta…'}
          value={value}
          onChange={e => { setValue(e.target.value); handleInput(); }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />
        <button
          className={`send-btn${!canSend ? ' off' : ''}`}
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Enviar"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path
              d="M7.5 12.5V2.5M7.5 2.5L3 7M7.5 2.5L12 7"
              stroke={canSend ? 'white' : 'rgba(255,255,255,0.3)'}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
