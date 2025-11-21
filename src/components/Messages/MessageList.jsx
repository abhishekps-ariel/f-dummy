import React, { useEffect, useRef, useState } from 'react';
import MessageItem from './MessageItem';

const MessageList = ({ 
  messages, 
  conversationAvatar, 
  onLoadMoreMessages, 
  hasMoreMessages, 
  loadingMoreMessages 
}) => {
  const messagesEndRef = useRef(null);
  const messagesListRef = useRef(null);
  const messagesTopRef = useRef(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const previousMessagesLengthRef = useRef(0);
  const scrollPositionRef = useRef(null);

  // Scroll to bottom on initial load or when new messages arrive at bottom
  useEffect(() => {
    const messagesLength = messages.length;
    const previousLength = previousMessagesLengthRef.current;
    
    //scroll to bottom when new messages arriving via SignalR
    if (messagesLength > previousLength && shouldScrollToBottom) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
    
    // On initial load, scroll to bottom
    if (previousLength === 0 && messagesLength > 0) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
      }, 100);
    }
    
    previousMessagesLengthRef.current = messagesLength;
  }, [messages, shouldScrollToBottom]);

  // Handle scroll to detect when user scrolls to top
  const handleScroll = (e) => {
    const container = e.target;
    const scrollTop = container.scrollTop;
    
    // If user scrolls to top and there are more messages, load them
    if (scrollTop < 100 && hasMoreMessages && !loadingMoreMessages && onLoadMoreMessages) {
      scrollPositionRef.current = {
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
      };
      
      // Load more messages
      onLoadMoreMessages();
    }
    
    // Track if user is near bottom (within 100px)
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldScrollToBottom(isNearBottom);
  };

  // Maintain scroll position when loading older messages
  useEffect(() => {
    if (!loadingMoreMessages && messagesListRef.current && scrollPositionRef.current) {
      const container = messagesListRef.current;
      const savedPosition = scrollPositionRef.current;
      
      // After messages are loaded, adjust scroll position to maintain view
      requestAnimationFrame(() => {
        const newScrollHeight = container.scrollHeight;
        const scrollDifference = newScrollHeight - savedPosition.scrollHeight;
        container.scrollTop = savedPosition.scrollTop + scrollDifference;
        scrollPositionRef.current = null;
      });
    }
  }, [messages, loadingMoreMessages]);

  return (
    <div 
      className="messages-list" 
      ref={messagesListRef}
      onScroll={handleScroll}
      style={{ overflowY: 'auto', height: '100%' }}
    >
      {loadingMoreMessages && (
        <div className="messages-loading-more text-center py-2">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Loading older messages...</span>
          </div>
        </div>
      )}
      <div ref={messagesTopRef} />
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

