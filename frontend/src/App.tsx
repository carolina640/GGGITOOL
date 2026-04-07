import { useState, useCallback, useRef } from 'react'
import Header from './components/Header'
import ChatArea from './components/ChatArea'
import InputArea from './components/InputArea'
import EmptyState from './components/EmptyState'
import { Message } from './types'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || '/api/chat';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // Cancel any previous in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      let accumulated = '';

      if (contentType.includes('application/json')) {
        // Vercel production: plain JSON response
        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }
        accumulated = data.text || 'Sin respuesta.';
      } else {
        // Local dev: SSE streaming
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) accumulated += data.text;
              } catch (_) {}
            }
          }
        }
      }

      setMessages([...newMessages, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: accumulated,
        timestamp: new Date(),
        isStreaming: false,
      }]);

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setMessages([...newMessages, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${msg}`,
        timestamp: new Date(),
        isStreaming: false,
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setIsLoading(false);
  }, []);

  return (
    <div className="app-layout">
      <Header onReset={handleReset} hasMessages={messages.length > 0 || isLoading} />
      <main className="app-main">
        {messages.length === 0 && !isLoading ? (
          <EmptyState onStarterPrompt={sendMessage} />
        ) : (
          <ChatArea messages={messages} isLoading={isLoading} />
        )}
      </main>
      <InputArea onSend={sendMessage} isLoading={isLoading} />
    </div>
  )
}
