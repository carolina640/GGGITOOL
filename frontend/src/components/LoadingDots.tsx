import './LoadingDots.css'

export default function LoadingCard() {
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
          <span>VERDE 2.0</span>
        </div>
        <p className="loading-txt">Procesando con los documentos regulatorios...</p>
        <div className="dots">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
        </div>
      </div>
    </div>
  );
}
