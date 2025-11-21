import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MessageItem from './MessageItem';
import DateBreaker from './DateBreaker';

const MessageList = ({ 
  messages, 
  conversationAvatar,
  conversationId,
  onLoadMoreMessages, 
  hasMoreMessages, 
  loadingMoreMessages 
}) => {
  const { t } = useTranslation();
  const messagesEndRef = useRef(null);
  const messagesListRef = useRef(null);
  const messagesTopRef = useRef(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const previousMessagesLengthRef = useRef(0);
  const scrollPositionRef = useRef(null);
  const previousConversationIdRef = useRef(null);

  // Helper function to get date label for a message
  const getDateLabel = (timestamp) => {
    if (!timestamp) return null;
    
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset time to compare only dates
    const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    
    if (messageDateOnly.getTime() === todayOnly.getTime()) {
      return t("messages.today");
    } else if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
      return t("messages.yesterday");
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  // Helper function to check if two messages are on different dates
  const isDifferentDate = (timestamp1, timestamp2) => {
    if (!timestamp1 || !timestamp2) return true;
    
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);
    
    return (
      date1.getFullYear() !== date2.getFullYear() ||
      date1.getMonth() !== date2.getMonth() ||
      date1.getDate() !== date2.getDate()
    );
  };

  // Group messages with date breakers
  const renderMessagesWithDateBreakers = () => {
    if (!messages || messages.length === 0) return null;
    
    const elements = [];
    let previousDate = null;
    
    messages.forEach((message, index) => {
      const currentDate = message.originalTimestamp 
        ? getDateLabel(message.originalTimestamp)
        : null;
      
      // Add date breaker if this is the first message or date changed
      if (currentDate && (index === 0 || isDifferentDate(message.originalTimestamp, messages[index - 1]?.originalTimestamp))) {
        elements.push(
          <DateBreaker key={`date-${message.id || index}`} date={currentDate} />
        );
        previousDate = currentDate;
      }
      
      // Add the message
      elements.push(
        <MessageItem
          key={message.id || index}
          message={message}
          conversationAvatar={conversationAvatar}
        />
      );
    });
    
    return elements;
  };

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
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
        // Use smooth scroll for better UX
        container.scrollTo({
          top: savedPosition.scrollTop + scrollDifference,
          behavior: 'smooth'
        });
        scrollPositionRef.current = null;
      });
    }
  }, [messages, loadingMoreMessages]);

  // Scroll to bottom when switching between conversations
  useEffect(() => {
    if (conversationId !== undefined && conversationId !== previousConversationIdRef.current) {
      // Conversation changed - scroll to bottom after messages are rendered
      const prevId = previousConversationIdRef.current;
      previousConversationIdRef.current = conversationId;
      setShouldScrollToBottom(true);
      
      // Only scroll if this is an actual conversation change (not initial mount)
      if (prevId !== null && prevId !== undefined) {
        // Wait for messages to render, then scroll to bottom
        // Use requestAnimationFrame for better timing
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            } else if (messagesListRef.current) {
              // Fallback: scroll container to bottom with smooth behavior
              messagesListRef.current.scrollTo({
                top: messagesListRef.current.scrollHeight,
                behavior: 'smooth'
              });
            }
          }, 100);
        });
      }
    }
  }, [conversationId, messages]);

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
            <span className="visually-hidden">{t("messages.loadingOlderMessages")}</span>
          </div>
        </div>
      )}
      <div ref={messagesTopRef} />
      {renderMessagesWithDateBreakers()}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

