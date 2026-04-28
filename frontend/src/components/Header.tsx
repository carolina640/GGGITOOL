import { useState } from 'react'
import './Header.css'
import Disclaimer from './Disclaimer'

interface HeaderProps {
  onReset?: () => void;
  hasMessages?: boolean;
  theme: 'dk' | 'lt';
  onThemeChange: (t: 'dk' | 'lt') => void;
}

export default function Header({ onReset, hasMessages, theme, onThemeChange }: HeaderProps) {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <>
      <header className="hdr">
        {/* Left — logo */}
        <div className="hdr-l">
          <img src="/assets/logo-gggi.svg" alt="GGGI" className="logo-gggi" />
        </div>

        {/* Center — identity */}
        <div className="hdr-c">
          <span className="h-title">ERSA</span>
          <span style={{ fontSize: '0.63rem', fontWeight: 500, opacity: 0.72, letterSpacing: '0.04em' }}>
            Environmental and Social Risk Assistant
          </span>
          <span style={{ fontSize: '0.54rem', opacity: 0.45, letterSpacing: '0.01em' }}>
            Asistente de riesgos ambientales y sociales (incluidos los climáticos)
          </span>
        </div>

        {/* Right — actions */}
        <div className="hdr-r">
          {hasMessages && onReset && (
            <button className="nbtn" onClick={onReset} aria-label="Reiniciar chat">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M12 7C12 9.76 9.76 12 7 12C4.24 12 2 9.76 2 7C2 4.24 4.24 2 7 2C8.68 2 10.16 2.85 11.07 4.14" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M10 1.5L11.2 3.8L8.8 4.8" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="btn-label">Reiniciar chat</span>
            </button>
          )}

          <button
            className="nbtn"
            onClick={() => setShowDisclaimer(true)}
            aria-label="Sobre esta herramienta"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.75)" strokeWidth="1.4"/>
              <path d="M8 7v4" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="8" cy="5" r="0.8" fill="rgba(255,255,255,0.75)"/>
            </svg>
            <span className="btn-label">Sobre esta herramienta</span>
          </button>

          <div className="tgl">
            <button
              className={`tgo${theme === 'dk' ? ' on' : ''}`}
              onClick={() => onThemeChange('dk')}
            >Oscuro</button>
            <button
              className={`tgo${theme === 'lt' ? ' on' : ''}`}
              onClick={() => onThemeChange('lt')}
            >Claro</button>
          </div>
        </div>
      </header>

      {showDisclaimer && <Disclaimer onClose={() => setShowDisclaimer(false)} />}
    </>
  );
}
