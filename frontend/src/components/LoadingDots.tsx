import { useMemo } from 'react'
import './LoadingDots.css'

const LOADING_MESSAGES = [
  'Revisando los documentos técnicos para encontrar la respuesta más precisa…',
  'Analizando la documentación de referencia. Un momento, por favor.',
  'Consultando las disposiciones aplicables. Esto puede tomar algunos segundos.',
  'Cruzando su consulta con el marco normativo disponible…',
  'Localizando la sección correspondiente en los documentos. Un instante.',
  'Procesando su consulta con base en la documentación oficial…',
  'Verificando la CE 0015 y documentos de referencia. Casi listo.',
  'Revisando los requisitos aplicables según el tipo de entidad. Un momento.',
];

export default function LoadingCard() {
  const msg = useMemo(
    () => LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)],
    []
  );

  return (
    <div className="msg-bot" aria-live="polite" aria-label="Generando respuesta">
      <div className="av-sq">
        <div style={{ animation: 'breathe 1.5s ease-in-out infinite' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C12 2 4 7 4 13.5C4 17.6 7.6 21 12 21C16.4 21 20 17.6 20 13.5C20 7 12 2 12 2Z" fill="#09B89D"/>
            <path d="M12 21V11" stroke="#044F44" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
      <div className="card loading-card">
        <div className="c-label">
          <span>ERSA</span>
        </div>
        <p className="loading-txt">{msg}</p>
        <div className="dots">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
        </div>
      </div>
    </div>
  );
}
