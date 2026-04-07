import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <div className="header-logos">
            <div className="logo-badge gggi">GGGI</div>
            <span className="logo-separator">·</span>
            <div className="logo-badge sfc">SFC</div>
          </div>
          <div className="header-title-group">
            <h1 className="header-title">Asistente ASC</h1>
            <p className="header-scope">CE 0015 de 2025 · Documentos técnicos SFC</p>
          </div>
        </div>
        <div className="header-badge">
          <span className="badge-dot"></span>
          <span>6 documentos · Base activa</span>
        </div>
      </div>
    </header>
  )
}
