import { useState, useEffect } from 'react'
import './LoadingDots.css'

const LOADING_PHRASES = [
  "Consultando la Circular Externa 0015...",
  "Revisando los anexos técnicos de la SFC...",
  "Buscando en los documentos de gestión de riesgos ASC...",
  "Verificando las obligaciones por sector...",
  "Revisando el Borrador Guía SFC...",
  "Analizando el marco normativo ASC...",
];

export default function LoadingDots() {
  const [phrase, setPhrase] = useState(LOADING_PHRASES[0]);
  const [_phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(prev => {
        const next = (prev + 1) % LOADING_PHRASES.length;
        setPhrase(LOADING_PHRASES[next]);
        return next;
      });
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-dots-wrapper">
      <p className="loading-phrase">{phrase}</p>
      <div className="dots">
        <span /><span /><span />
      </div>
    </div>
  );
}
