import { useState, useCallback } from 'react'
import Header from './components/Header'
import ChatArea from './components/ChatArea'
import InputArea from './components/InputArea'
import EmptyState from './components/EmptyState'
import { Message } from './types'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/chat';

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

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    const newMessages = [...messages, userMessage];
    setMessages([...newMessages, assistantMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      if (!response.ok) throw new Error('API request failed');

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                accumulated += data.text;
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessage.id
                    ? { ...m, content: accumulated }
                    : m
                ));
              }
              if (data.done || data.error) {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMessage.id
                    ? { ...m, isStreaming: false }
                    : m
                ));
              }
            } catch (_) {}
          }
        }
      }
    } catch (_error) {
      setMessages(prev => prev.map(m =>
        m.id === assistantMessage.id
          ? { ...m, content: 'Error de conexión. Verifica que el servidor esté activo.', isStreaming: false }
          : m
      ));
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
        {messages.length === 0 ? (
          <EmptyState onStarterPrompt={handleStarterPrompt} />
        ) : (
          <ChatArea messages={messages} isLoading={isLoading} />
        )}
      </main>
      <InputArea onSend={sendMessage} isLoading={isLoading} />
    </div>
  )
}
