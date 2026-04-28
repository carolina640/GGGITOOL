import './Disclaimer.css'

interface DisclaimerProps {
  onClose: () => void;
}

const BLOCKS = [
  {
    title: 'Naturaleza y propósito',
    body: 'El Asistente ERSA es una herramienta de consulta desarrollada por el equipo de Finanzas Sostenibles de GGGI Colombia. Su base de conocimiento está construida a partir de documentación técnica y regulatoria sobre gestión de riesgos ambientales, sociales y climáticos para instituciones financieras en Colombia, incluyendo la CE 0015 de 2025 y documentos de referencia previos a su expedición. No incorpora fuentes externas, interpretaciones de terceros ni desarrollos normativos posteriores a la fecha de entrenamiento.',
  },
  {
    title: 'Cobertura temática',
    body: 'La herramienta cubre: (i) identificación, medición y gestión de riesgos ambientales, sociales y climáticos; (ii) obligaciones de gobierno corporativo y estructura organizacional; (iii) requerimientos de divulgación y reporte ante la SFC; (iv) cronogramas de implementación diferenciados por tipo y tamaño de entidad; (v) definiciones y estándares técnicos de los documentos de referencia. Consultas fuera de este alcance no serán respondidas con base documental.',
  },
  {
    title: 'Alcance y limitaciones',
    body: 'El asistente no emite conceptos jurídicos, no interpreta la norma más allá de su texto, y no suple el criterio técnico o jurídico del supervisor ni de los profesionales responsables del cumplimiento. Las respuestas son de carácter informativo y de orientación. Esta herramienta está concebida como apoyo para consultas rápidas. No ejerce función supervisora ni reemplaza el criterio de la Superintendencia Financiera de Colombia.',
  },
  {
    title: 'Privacidad y gestión de datos',
    body: 'El Asistente ERSA no cuenta con memoria persistente. Las conversaciones no se almacenan, no se asocian a perfiles de usuario y no son accesibles entre sesiones. Cada vez que se cierra o recarga la interfaz, la sesión se reinicia completamente. No se retiene información sobre las consultas realizadas ni sobre la entidad o persona que las formula.',
  },
];

export default function Disclaimer({ onClose }: DisclaimerProps) {
  return (
    <div className="disc-overlay" role="dialog" aria-modal="true" aria-label="Sobre esta herramienta" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="disc-modal">
        <div className="disc-header">
          <span className="disc-title">Sobre esta herramienta</span>
          <button className="disc-close" onClick={onClose} aria-label="Cerrar">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="disc-body">
          {BLOCKS.map((block, i) => (
            <div key={i} className="disc-block">
              <p className="disc-block-title">{block.title}</p>
              <p className="disc-block-body">{block.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
