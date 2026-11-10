import { useState, useEffect, useRef } from 'react'
import './LoadingDots.css'

const MESSAGES = [
  'Revisando los documentos técnicos para encontrar la respuesta más precisa…',
  'Analizando la documentación de referencia. Un momento, por favor.',
  'Consultando las disposiciones aplicables…',
  'Cruzando tu consulta con el marco normativo disponible…',
  'Localizando la sección correspondiente en los documentos…',
  'Procesando tu consulta con base en la documentación oficial…',
  'Verificando la información antes de responder…',
  'Revisando los requisitos aplicables según el tipo de entidad…',
];

const ROTATE_MS  = 3500;
const PATIENCE_S = 20;

export default function LoadingCard() {
  const [idx,          setIdx]          = useState(() => Math.floor(Math.random() * MESSAGES.length));
  const [showPatience, setShowPatience] = useState(false);
  const elapsedRef = useRef(0);

  useEffect(() => {
    // Patience: one state update at 20 s, then stops
    const patienceTimer = setInterval(() => {
      elapsedRef.current += 1;
      if (elapsedRef.current >= PATIENCE_S) {
        setShowPatience(true);
        clearInterval(patienceTimer);
      }
    }, 1000);

    // Text rotation: instant swap, no fade
    const rotateTimer = setInterval(() => {
      setIdx(prev => (prev + 1) % MESSAGES.length);
    }, ROTATE_MS);

    return () => {
      clearInterval(patienceTimer);
      clearInterval(rotateTimer);
    };
  }, []);

  return (
    <div className="msg-bot" aria-live="polite" aria-label="Generando respuesta">
      <div className="av-sq">
        <div className="leaf-static">
          <div className="leaf-halo" />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C12 2 4 7 4 13.5C4 17.6 7.6 21 12 21C16.4 21 20 17.6 20 13.5C20 7 12 2 12 2Z" fill="#09B89D"/>
            <path d="M12 21V11" stroke="#044F44" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      <div className="card loading-card">
        <div className="c-label"><span>ERSA</span></div>

        <p className="loading-txt" aria-atomic="true">
          {MESSAGES[idx]}
        </p>

        <div className="ld-pulse" role="presentation" />

        {showPatience && (
          <p className="ld-patience">
            Esta consulta requiere revisar varias secciones. Gracias por tu paciencia.
          </p>
        )}
      </div>
    </div>
  );
}
