import './Header.css'

interface HeaderProps {
  onReset?: () => void;
  hasMessages?: boolean;
  theme: 'dk' | 'lt';
  onThemeChange: (t: 'dk' | 'lt') => void;
}

export default function Header({ onReset, hasMessages, theme, onThemeChange }: HeaderProps) {
  return (
    <header className="hdr">
      <div className="hdr-l">
        <img
          src="/assets/logo-gggi.svg"
          alt="GGGI"
          className="logo-gggi"
        />
      </div>

      <span className="h-title">Verde 2.0</span>

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
  );
}
