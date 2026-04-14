import { Message } from '../types'
import './MessageBubble.css'

interface MessageBubbleProps {
  message: Message;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit', hour12: true });
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
    if (part.startsWith('`')  && part.endsWith('`'))  return <code key={i} className="inline-code">{part.slice(1, -1)}</code>;
    return part;
  });
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('### ')) { nodes.push(<h4 key={i} className="md-h3">{renderInline(line.slice(4))}</h4>); i++; continue; }
    if (line.startsWith('## '))  { nodes.push(<h3 key={i} className="md-h2">{renderInline(line.slice(3))}</h3>); i++; continue; }
    if (line.startsWith('# '))   { nodes.push(<h2 key={i} className="md-h1">{renderInline(line.slice(2))}</h2>); i++; continue; }
    if (line.trim() === '---' || line.trim() === '***') { nodes.push(<hr key={i} className="md-hr" />); i++; continue; }
    if (line.startsWith('> '))  { nodes.push(<blockquote key={i} className="md-bq">{renderInline(line.slice(2))}</blockquote>); i++; continue; }

    if (line.match(/^[-•*] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-•*] /)) { items.push(lines[i].replace(/^[-•*] /, '')); i++; }
      nodes.push(
        <ul key={`ul-${i}`} className="md-ul">
          {items.map((item, j) => (
            <li key={j}><span className="lib">▸</span><span>{renderInline(item)}</span></li>
          ))}
        </ul>
      );
      continue;
    }
    if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) { items.push(lines[i].replace(/^\d+\. /, '')); i++; }
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
      <div className="msg-user">
        <div className="bubble">{message.content}</div>
      </div>
    );
  }

  const parts = parseAssistantContent(message.content);
  const textParts        = parts.filter(p => p.type === 'text');
  const sourcePart       = parts.find(p  => p.type === 'source');
  const propPart         = parts.find(p  => p.type === 'proportionality');
  const caveatPart       = parts.find(p  => p.type === 'caveat');

  return (
    <div className="msg-bot">
      <div className="av-sq">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C12 2 4 7 4 13.5C4 17.6 7.6 21 12 21C16.4 21 20 17.6 20 13.5C20 7 12 2 12 2Z" fill="#09B89D"/>
          <path d="M12 21V11" stroke="#044F44" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="card">
        <div className="c-label">
          <span>VERDE 2.0</span>
          <span className="c-ts">{formatTime(message.timestamp)}</span>
        </div>
        <div className="c-body">
          {textParts.map((part, i) => (
            <div key={i}>{renderMarkdown(part.content)}</div>
          ))}
          {propPart && (
            <div className="c-prop">
              <span>⚖️ <strong>Proporcionalidad:</strong></span> {renderInline(propPart.content)}
            </div>
          )}
          {caveatPart && (
            <div className="c-caveat">
              <span>⚠️ <strong>Criterio del supervisor:</strong></span> {renderInline(caveatPart.content)}
            </div>
          )}
          {sourcePart && (
            <div className="c-source">
              📄 <strong>Fuente:</strong> {sourcePart.content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
