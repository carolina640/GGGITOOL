import './Header.css'

function GGGICubeMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <polygon points="16,2 28,9 16,16 4,9" fill="#14B8A6" opacity="0.95"/>
      <polygon points="4,9 16,16 16,30 4,23" fill="#0D5C54" opacity="0.95"/>
      <polygon points="28,9 16,16 16,30 28,23" fill="#0F766E" opacity="0.95"/>
      <polygon points="16,4.5 25,9 16,13.5 7,9" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5"/>
    </svg>
  )
}

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <div className="header-logos">
            <GGGICubeMark />
            <div className="header-wordmark">
              <span className="wordmark-gggi">GGGI</span>
              <span className="wordmark-dot">·</span>
              <span className="wordmark-sfc">SFC</span>
            </div>
          </div>
          <div className="header-divider" aria-hidden="true" />
          <div className="header-title-group">
            <h1 className="header-title">Asistente ASC</h1>
            <p className="header-scope">CE 0015 de 2025 · Gestión de riesgos ambientales, sociales y climáticos</p>
          </div>
        </div>
      </div>
    </header>
  )
}
