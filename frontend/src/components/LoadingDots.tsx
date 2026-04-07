import { useState, useEffect } from 'react'
import './LoadingDots.css'

const THINKING_PHRASES = [
  "Consultando la Circular Externa 0015...",
  "Revisando los anexos técnicos de la SFC...",
  "Buscando en los documentos de gestión de riesgos ASC...",
  "Verificando las obligaciones por sector...",
  "Revisando el Borrador Guía SFC...",
  "Analizando el marco normativo ASC...",
];

export default function ThinkingIndicator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % THINKING_PHRASES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="thinking-row" aria-live="polite" aria-label="Generando respuesta">
      <span className="thinking-label">Asistente ASC</span>
      <span className="thinking-separator">·</span>
      <span className="thinking-phrase" key={index}>{THINKING_PHRASES[index]}</span>
    </div>
  );
}
