import { useEffect, useRef } from 'react'
import { Message } from '../types'
import MessageBubble from './MessageBubble'
import LoadingCard from './LoadingDots'
import './ChatArea.css'

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatArea({ messages, isLoading }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll once when the indicator appears and once when the response lands.
  // Using messages.length avoids re-firing on internal loading-card re-renders.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  return (
    <div className="chat-area">
      <div className="chat-messages">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <LoadingCard />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
