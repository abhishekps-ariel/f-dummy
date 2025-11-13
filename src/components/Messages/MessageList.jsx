import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';

const MessageList = ({ messages, conversationAvatar }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="messages-list">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          conversationAvatar={conversationAvatar}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

