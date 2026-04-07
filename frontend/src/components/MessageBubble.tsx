import { Message } from '../types'
import './MessageBubble.css'

interface MessageBubbleProps {
  message: Message;
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

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  // Handle **bold** and `code`
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

    // Headings
    if (line.startsWith('### ')) {
      nodes.push(<h4 key={i} className="md-h3">{renderInline(line.slice(4))}</h4>); i++; continue;
    }
    if (line.startsWith('## ')) {
      nodes.push(<h3 key={i} className="md-h2">{renderInline(line.slice(3))}</h3>); i++; continue;
    }
    if (line.startsWith('# ')) {
      nodes.push(<h2 key={i} className="md-h1">{renderInline(line.slice(2))}</h2>); i++; continue;
    }

    // Horizontal rule
    if (line.trim() === '---' || line.trim() === '***') {
      nodes.push(<hr key={i} className="md-hr" />); i++; continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      nodes.push(<blockquote key={i} className="md-blockquote">{renderInline(line.slice(2))}</blockquote>); i++; continue;
    }

    // Table
    if (line.includes('|') && lines[i + 1]?.includes('---')) {
      const headers = line.split('|').map(c => c.trim()).filter(c => c);
      i += 2; // skip header + separator
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

    // Bullet list
    if (line.match(/^[-•*] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-•*] /)) {
        items.push(lines[i].replace(/^[-•*] /, ''));
        i++;
      }
      nodes.push(<ul key={`ul-${i}`} className="md-ul">{items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}</ul>);
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      nodes.push(<ol key={`ol-${i}`} className="md-ol">{items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}</ol>);
      continue;
    }

    // Empty line
    if (line.trim() === '') { i++; continue; }

    // Regular paragraph
    nodes.push(<p key={i} className="md-p">{renderInline(line)}</p>);
    i++;
  }

  return nodes;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MessageBubble({ message }: MessageBubbleProps) {
  // Skip empty assistant messages (aborted requests)
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
          <span className="ai-dot">●</span>
          <span>Asistente ASC</span>
          {message.isStreaming && <span className="streaming-indicator" />}
        </div>

        <div className={`msg-bubble assistant ${message.isStreaming ? 'streaming' : ''}`}>
          {message.content === '' ? null : (
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
                  <span className="prop-icon">⚖</span>
                  <div>
                    <span className="prop-label">Proporcionalidad</span>
                    <p>{renderInline(proportionalityPart.content)}</p>
                  </div>
                </div>
              )}

              {caveatPart && (
                <div className="msg-caveat">
                  <span className="caveat-icon">⚠</span>
                  <div>
                    <span className="caveat-label">Criterio del supervisor</span>
                    <p>{renderInline(caveatPart.content)}</p>
                  </div>
                </div>
              )}

              {sourcePart && (
                <div className="msg-source">
                  <span className="source-icon">📄</span>
                  <span className="source-label">Fuente:</span>
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
