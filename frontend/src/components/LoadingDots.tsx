import { useState, useEffect } from 'react'
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
const FADE_MS    = 400;
const PATIENCE_S = 20;

export default function LoadingCard() {
  const [idx,     setIdx]     = useState(() => Math.floor(Math.random() * MESSAGES.length));
  const [visible, setVisible] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const elapsedTimer = setInterval(() => setElapsed(s => s + 1), 1000);

    const rotateTimer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(prev => (prev + 1) % MESSAGES.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);

    return () => {
      clearInterval(elapsedTimer);
      clearInterval(rotateTimer);
    };
  }, []);

  return (
    <div className="msg-bot" aria-live="polite" aria-label="Generando respuesta">
      <div className="av-sq">
        <div className="leaf-breath">
          <div className="leaf-halo" />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C12 2 4 7 4 13.5C4 17.6 7.6 21 12 21C16.4 21 20 17.6 20 13.5C20 7 12 2 12 2Z" fill="#09B89D"/>
            <path d="M12 21V11" stroke="#044F44" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      <div className="card loading-card">
        <div className="c-label"><span>ERSA</span></div>

        <p className={`loading-txt${visible ? ' vis' : ''}`}>
          {MESSAGES[idx]}
        </p>

        <div className="ld-progress" role="progressbar" aria-label="Procesando">
          <div className="ld-progress-fill" />
        </div>

        {elapsed >= PATIENCE_S && (
          <p className="ld-patience">
            Esta consulta requiere revisar varias secciones. Gracias por tu paciencia.
          </p>
        )}
      </div>
    </div>
  );
}
