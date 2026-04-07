import { Message } from '../types'
import './MessageBubble.css'

interface MessageBubbleProps {
  message: Message;
}

// SVG icons for metadata blocks
function IconSource() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <rect x="1.5" y="1" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <line x1="4" y1="4.5" x2="9" y2="4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="4" y1="6.5" x2="9" y2="6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="4" y1="8.5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function IconProp() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="3.5" y1="2" x2="10.5" y2="2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M2.5 4.5 L1 7.5 C1 8.3 1.7 9 2.5 9 C3.3 9 4 8.3 4 7.5 L2.5 4.5Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <path d="M11.5 4.5 L10 7.5 C10 8.3 10.7 9 11.5 9 C12.3 9 13 8.3 13 7.5 L11.5 4.5Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    </svg>
  )
}

function IconCaveat() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1.5 L12.5 11 H1.5 Z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round"/>
      <line x1="7" y1="5.5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="7" cy="10" r="0.7" fill="currentColor"/>
    </svg>
  )
}

function parseAssistantContent(content: string) {
  const parts: { type: 'text' | 'source' | 'proportionality' | 'caveat'; content: string }[] = [];
  const lines = content.split('\n');
  let currentText = '';

  for (const line of lines) {
    if (line.match(/^📄\s*(Fuente|Source):/)) {
      if (currentText.trim()) { parts.push({ type: 'text', content: currentText.trim() }); currentText = ''; }
      parts.push({ type: 'source', content: line.replace(/^📄\s*(Fuente|Source):\s*/, '').trim() });
    } else if (line.match(/^⚖\s*(PROPORCIONALIDAD|Proporcionalidad):/)) {
      if (currentText.trim()) { parts.push({ type: 'text', content: currentText.trim() }); currentText = ''; }
      parts.push({ type: 'proportionality', content: line.replace(/^⚖\s*(PROPORCIONALIDAD|Proporcionalidad):\s*/, '').trim() });
    } else if (line.match(/^⚠\s*(CRITERIO DE SUPERVISOR|Criterio)/)) {
      if (currentText.trim()) { parts.push({ type: 'text', content: currentText.trim() }); currentText = ''; }
      parts.push({ type: 'caveat', content: line.replace(/^⚠\s*(CRITERIO DE SUPERVISOR|Criterio[^:]*):\s*/, '').trim() });
    } else {
      currentText += (currentText ? '\n' : '') + line;
    }
  }
  if (currentText.trim()) parts.push({ type: 'text', content: currentText.trim() });
  return parts;
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="inline-code">{part.slice(1, -1)}</code>;
    return part;
  });
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      nodes.push(<h4 key={i} className="md-h3">{renderInline(line.slice(4))}</h4>); i++; continue;
    }
    if (line.startsWith('## ')) {
      nodes.push(<h3 key={i} className="md-h2">{renderInline(line.slice(3))}</h3>); i++; continue;
    }
    if (line.startsWith('# ')) {
      nodes.push(<h2 key={i} className="md-h1">{renderInline(line.slice(2))}</h2>); i++; continue;
    }
    if (line.trim() === '---' || line.trim() === '***') {
      nodes.push(<hr key={i} className="md-hr" />); i++; continue;
    }
    if (line.startsWith('> ')) {
      nodes.push(<blockquote key={i} className="md-blockquote">{renderInline(line.slice(2))}</blockquote>); i++; continue;
    }
    if (line.includes('|') && lines[i + 1]?.includes('---')) {
      const headers = line.split('|').map(c => c.trim()).filter(c => c);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(lines[i].split('|').map(c => c.trim()).filter(c => c));
        i++;
      }
      nodes.push(
        <div key={`table-${i}`} className="md-table-wrapper">
          <table className="md-table">
            <thead><tr>{headers.map((h, j) => <th key={j}>{renderInline(h)}</th>)}</tr></thead>
            <tbody>{rows.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{renderInline(cell)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }
    if (line.match(/^[-•*] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-•*] /)) {
        items.push(lines[i].replace(/^[-•*] /, ''));
        i++;
      }
      nodes.push(<ul key={`ul-${i}`} className="md-ul">{items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}</ul>);
      continue;
    }
    if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      nodes.push(<ol key={`ol-${i}`} className="md-ol">{items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}</ol>);
      continue;
    }
    if (line.trim() === '') { i++; continue; }
    nodes.push(<p key={i} className="md-p">{renderInline(line)}</p>);
    i++;
  }

  return nodes;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === 'assistant' && !message.content && !message.isStreaming) return null;

  if (message.role === 'user') {
    return (
      <div className="msg-row user">
        <div className="msg-bubble user"><p>{message.content}</p></div>
      </div>
    );
  }

  const parts = parseAssistantContent(message.content);
  const textParts = parts.filter(p => p.type === 'text');
  const sourcePart = parts.find(p => p.type === 'source');
  const proportionalityPart = parts.find(p => p.type === 'proportionality');
  const caveatPart = parts.find(p => p.type === 'caveat');

  return (
    <div className="msg-row assistant">
      <div className="msg-assistant-wrapper">
        <div className="ai-author-label">
          <span>Asistente ASC</span>
        </div>

        <div className="msg-bubble assistant">
          {message.content !== '' && (
            <>
              <div className="msg-main-content">
                {textParts.map((part, i) => (
                  <div key={i} className="msg-text-block">
                    {renderMarkdown(part.content)}
                  </div>
                ))}
              </div>

              {proportionalityPart && (
                <div className="msg-proportionality">
                  <span className="prop-icon"><IconProp /></span>
                  <div>
                    <span className="prop-label">Proporcionalidad</span>
                    <p>{renderInline(proportionalityPart.content)}</p>
                  </div>
                </div>
              )}

              {caveatPart && (
                <div className="msg-caveat">
                  <span className="caveat-icon"><IconCaveat /></span>
                  <div>
                    <span className="caveat-label">Criterio del supervisor</span>
                    <p>{renderInline(caveatPart.content)}</p>
                  </div>
                </div>
              )}

              {sourcePart && (
                <div className="msg-source">
                  <span className="source-icon"><IconSource /></span>
                  <span className="source-label">Fuente</span>
                  <span className="source-text">{sourcePart.content}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
