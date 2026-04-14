import { useEffect, useRef } from 'react'
import './EmptyState.css'

interface EmptyStateProps {
  onStarterPrompt: (prompt: string) => void;
  theme: 'dk' | 'lt';
}

const CHIPS = [
  { label: '¿Qué obligaciones tiene un banco en el plan ASC?',  prompt: '¿Qué información debe incluir el plan de implementación ASC de un establecimiento de crédito según la CE 0015?' },
  { label: '¿Cómo difieren bancos y aseguradoras?',             prompt: '¿En qué difieren las obligaciones de gestión de riesgos ASC entre bancos y aseguradoras bajo la CE 0015?' },
  { label: '¿Cuáles son los indicadores del Anexo I?',          prompt: '¿Cuáles son los indicadores mínimos que debe reportar una microfinanciera según el Anexo I de la CE 0015?' },
];

function GlobeCanvas({ theme }: { theme: 'dk' | 'lt' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRef  = useRef(theme);

  useEffect(() => { themeRef.current = theme; }, [theme]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const cx = cv.getContext('2d')!;

    let animId = 0;
    let angle = 0;
    let globeR = 130, gx = 0, gy = 0;
    let pts: { theta: number; phi: number; speed: number; r: number; x: number; y: number; z: number }[] = [];

    function initP() {
      const rect = cv!.parentElement!.getBoundingClientRect();
      cv!.width  = rect.width  || 700;
      cv!.height = rect.height || 420;
      globeR = Math.max(160, Math.min(240, cv!.width * 0.32));
      gx = cv!.width  - globeR * 0.55;
      gy = cv!.height / 2;
      pts = [];

      const latRings = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75];
      latRings.forEach(lat => {
        const count = Math.floor(5 + Math.random() * 4);
        for (let i = 0; i < count; i++) {
          pts.push({
            theta: (i / count) * Math.PI * 2 + Math.random() * 0.3,
            phi:   lat + (Math.random() - 0.5) * 0.18,
            speed: (Math.random() - 0.5) * 0.0008,
            r: Math.random() * 1.6 + 0.9,
            x: 0, y: 0, z: 0,
          });
        }
      });
      for (let i = 0; i < 18; i++) {
        pts.push({
          theta: Math.random() * Math.PI * 2,
          phi:   Math.acos(2 * Math.random() - 1),
          speed: (Math.random() - 0.5) * 0.0008,
          r: Math.random() * 1.4 + 0.8,
          x: 0, y: 0, z: 0,
        });
      }
    }

    function projectPt(p: typeof pts[0]) {
      const x3 = Math.sin(p.phi) * Math.cos(p.theta + angle);
      const y3 = Math.cos(p.phi);
      const z3 = Math.sin(p.phi) * Math.sin(p.theta + angle);
      p.x = gx + x3 * globeR;
      p.y = gy + y3 * globeR;
      p.z = z3;
    }

    function draw() {
      cx.clearRect(0, 0, cv!.width, cv!.height);
      angle += 0.0008;

      const isLight = themeRef.current === 'lt';
      const opMult  = isLight ? 2.6 : 1.0;

      const grad = cx.createRadialGradient(gx, gy, globeR * 0.3, gx, gy, globeR);
      grad.addColorStop(0,   `rgba(9,184,157,${0.06 * opMult})`);
      grad.addColorStop(0.7, `rgba(9,184,157,${0.03 * opMult})`);
      grad.addColorStop(1,   'rgba(9,184,157,0)');
      cx.beginPath();
      cx.arc(gx, gy, globeR, 0, Math.PI * 2);
      cx.fillStyle = grad;
      cx.fill();

      cx.beginPath();
      cx.arc(gx, gy, globeR, 0, Math.PI * 2);
      cx.strokeStyle = `rgba(9,184,157,${0.07 * opMult})`;
      cx.lineWidth = 0.4;
      cx.stroke();

      pts.forEach(p => { p.theta += p.speed; projectPt(p); });

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          if (a.z < -0.1 || b.z < -0.1) continue;
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < globeR * 0.38) {
            const depth = ((a.z + 1) / 2) * ((b.z + 1) / 2);
            const alpha = 0.28 * opMult * (1 - d / (globeR * 0.38)) * depth;
            cx.beginPath();
            cx.moveTo(a.x, a.y);
            cx.lineTo(b.x, b.y);
            cx.strokeStyle = `rgba(9,184,157,${Math.min(alpha, 0.88)})`;
            cx.lineWidth = 0.6;
            cx.stroke();
          }
        }
      }

      pts.forEach(p => {
        const v = (p.z + 1) / 2;
        if (v < 0.06) return;
        cx.beginPath();
        cx.arc(p.x, p.y, p.r * (0.35 + v * 0.65), 0, Math.PI * 2);
        cx.fillStyle = `rgba(9,184,157,${Math.min(0.75 * v * opMult, 0.95)})`;
        cx.fill();
      });

      animId = requestAnimationFrame(draw);
    }

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(initP, 120);
    };
    window.addEventListener('resize', onResize);

    setTimeout(() => { initP(); draw(); }, 80);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}

export default function EmptyState({ onStarterPrompt, theme }: EmptyStateProps) {
  return (
    <div className="empty">
      <GlobeCanvas theme={theme} />
      <div className="e-inner">
        <div className="e-av">
          <div style={{ animation: 'breathe 1.6s ease-in-out infinite' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C12 2 4 7 4 13.5C4 17.6 7.6 21 12 21C16.4 21 20 17.6 20 13.5C20 7 12 2 12 2Z" fill="#09B89D"/>
              <path d="M12 21V11" stroke="#044F44" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M12 16C10 14.8 8.5 12.5 8.5 10" stroke="rgba(4,79,68,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <div className="e-name">
          <span>Verde 2.0</span>
          <span className="badge">ASC</span>
        </div>

        <h2 className="e-title">Consultas sobre la CE 0015 de 2025</h2>
        <p className="e-sub">Gestión de riesgos ambientales, sociales y climáticos.</p>

        <div className="chips">
          {CHIPS.map((c, i) => (
            <button key={i} className="chip" onClick={() => onStarterPrompt(c.prompt)}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="status">
          <div className="sdot" />
          <span className="stext">
            Consultas basadas exclusivamente en la <strong>CE 0015 de 2025</strong> y sus documentos técnicos
          </span>
        </div>
      </div>
    </div>
  );
}
