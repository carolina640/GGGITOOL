import { useState, useCallback } from 'react'
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

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentType = response.headers.get('content-type') || '';
      let accumulated = '';

      if (contentType.includes('application/json')) {
        // Vercel production: plain JSON response
        const data = await response.json();
        accumulated = data.text || data.error || 'Sin respuesta.';
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

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: accumulated,
        timestamp: new Date(),
        isStreaming: false,
      };
      setMessages([...newMessages, assistantMessage]);

    } catch (_error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Error de conexión. Verifica que el servidor esté activo.',
        timestamp: new Date(),
        isStreaming: false,
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const handleStarterPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className="app-layout">
      <Header />
      <main className="app-main">
        {messages.length === 0 && !isLoading ? (
          <EmptyState onStarterPrompt={handleStarterPrompt} />
        ) : (
          <ChatArea messages={messages} isLoading={isLoading} />
        )}
      </main>
      <InputArea onSend={sendMessage} isLoading={isLoading} />
    </div>
  )
}
