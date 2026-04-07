import './EmptyState.css'

interface EmptyStateProps {
  onStarterPrompt: (prompt: string) => void;
}

function IconReport() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="7" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7" y1="13" x2="10" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function IconScale() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <line x1="10" y1="3" x2="10" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="5" y1="3" x2="15" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 6 L2 11 C2 12.1 2.9 13 4 13 C5.1 13 6 12.1 6 11 L4 6Z" stroke="currentColor" strokeWidth="1.3" fill="none"/>
      <path d="M16 6 L14 11 C14 12.1 14.9 13 16 13 C17.1 13 18 12.1 18 11 L16 6Z" stroke="currentColor" strokeWidth="1.3" fill="none"/>
      <line x1="4" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1.5"/>
      <line x1="10" y1="6" x2="16" y2="6" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1.5"/>
    </svg>
  )
}

function IconChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="12" width="3" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="8.5" y="8" width="3" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="14" y="4" width="3" height="13" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="2" y1="18" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

const STARTER_PROMPTS = [
  {
    label: "Obligaciones de reporte",
    prompt: "¿Qué información debe incluir el plan de implementación ASC de un establecimiento de crédito según la CE 0015?",
    Icon: IconReport
  },
  {
    label: "Diferencias por sector",
    prompt: "¿En qué difieren las obligaciones de gestión de riesgos ASC entre bancos y aseguradoras bajo la CE 0015?",
    Icon: IconScale
  },
  {
    label: "Indicadores del Anexo I",
    prompt: "¿Cuáles son los indicadores mínimos que debe reportar una microfinanciera según el Anexo I de la CE 0015?",
    Icon: IconChart
  }
];

export default function EmptyState({ onStarterPrompt }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-content">

        <div className="empty-hero">
          <p className="empty-eyebrow">Asistente ASC</p>
          <h2 className="empty-title">
            Consultas sobre la CE 0015 de 2025 y gestión de riesgos ambientales, sociales y climáticos — para supervisores de la SFC.
          </h2>
          <p className="empty-disclaimer">
            Las respuestas orientan — el criterio de supervisión lo aplicas tú.
          </p>
        </div>

        <div className="starter-prompts">
          <p className="starters-label">Preguntas frecuentes</p>
          <div className="starters-grid">
            {STARTER_PROMPTS.map((starter, i) => (
              <button
                key={i}
                className="starter-btn"
                onClick={() => onStarterPrompt(starter.prompt)}
                aria-label={`Preguntar sobre: ${starter.label}`}
              >
                <span className="starter-icon-wrap">
                  <starter.Icon />
                </span>
                <span className="starter-label">{starter.label}</span>
                <span className="starter-text">{starter.prompt}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
