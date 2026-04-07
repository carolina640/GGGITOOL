import './EmptyState.css'

interface EmptyStateProps {
  onStarterPrompt: (prompt: string) => void;
}

const STARTER_PROMPTS = [
  {
    label: "Obligaciones de reporte",
    prompt: "¿Qué información debe incluir el plan de implementación ASC de un establecimiento de crédito según la CE 0015?",
    icon: "📋"
  },
  {
    label: "Diferencias por sector",
    prompt: "¿En qué difieren las obligaciones de gestión de riesgos ASC entre bancos y aseguradoras bajo la CE 0015?",
    icon: "⚖️"
  },
  {
    label: "Indicadores del Anexo I",
    prompt: "¿Cuáles son los indicadores mínimos que debe reportar una microfinanciera según el Anexo I de la CE 0015?",
    icon: "📊"
  }
];

export default function EmptyState({ onStarterPrompt }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-content">
        <div className="empty-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="23" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3"/>
            <path d="M24 14v10M24 30v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M16 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6"/>
            <circle cx="24" cy="34" r="1.5" fill="currentColor"/>
          </svg>
        </div>

        <div className="empty-text">
          <h2 className="empty-title">Asistente ASC</h2>
          <p className="empty-description">
            Consultas sobre la CE 0015 de 2025 y gestión de riesgos ambientales, sociales y climáticos para supervisores de la SFC.
          </p>
        </div>

        <div className="empty-scope">
          <p className="scope-label">Base de conocimiento</p>
          <div className="scope-items">
            <span className="scope-item">CE 0015 de 2025</span>
            <span className="scope-item">Anexos técnicos</span>
            <span className="scope-item">Guía SFC 2026</span>
            <span className="scope-item">Riesgos climáticos</span>
          </div>
        </div>

        <div className="starter-prompts">
          <p className="starters-label">Preguntas frecuentes</p>
          <div className="starters-grid">
            {STARTER_PROMPTS.map((starter, i) => (
              <button
                key={i}
                className="starter-btn"
                onClick={() => onStarterPrompt(starter.prompt)}
              >
                <span className="starter-icon">{starter.icon}</span>
                <span className="starter-label">{starter.label}</span>
                <span className="starter-text">{starter.prompt}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="empty-disclaimer">
          Las respuestas orientan — el criterio de supervisión lo aplicas tú.
        </p>
      </div>
    </div>
  )
}
