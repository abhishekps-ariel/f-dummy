import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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

  // Helper function to get date label for a message (memoized)
  const getDateLabel = useCallback((timestamp) => {
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
  }, [t]);

  // Helper function to check if two messages are on different dates (memoized)
  const isDifferentDate = useCallback((timestamp1, timestamp2) => {
    if (!timestamp1 || !timestamp2) return true;
    
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);
    
    return (
      date1.getFullYear() !== date2.getFullYear() ||
      date1.getMonth() !== date2.getMonth() ||
      date1.getDate() !== date2.getDate()
    );
  }, []);

  // Group messages with date breakers (memoized)
  const renderMessagesWithDateBreakers = useMemo(() => {
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
  }, [messages, conversationAvatar, getDateLabel, isDifferentDate]);

  // Scroll to bottom on initial load or when new messages arrive at bottom
  useEffect(() => {
    const messagesLength = messages.length;
    const previousLength = previousMessagesLengthRef.current;
    
    // Scroll to bottom when new messages arriving via SignalR (instant, no animation)
    if (messagesLength > previousLength && shouldScrollToBottom) {
      // Use requestAnimationFrame for immediate positioning without animation
      requestAnimationFrame(() => {
        if (messagesListRef.current) {
          messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
        }
      });
    }
    
    // On initial load, scroll to bottom instantly
    if (previousLength === 0 && messagesLength > 0) {
      // Set scroll position immediately without animation
      requestAnimationFrame(() => {
        if (messagesListRef.current) {
          messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
        }
      });
    }
    
    previousMessagesLengthRef.current = messagesLength;
  }, [messages, shouldScrollToBottom]);

  // Handle scroll to detect when user scrolls to top (memoized)
  const handleScroll = useCallback((e) => {
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
  }, [hasMoreMessages, loadingMoreMessages, onLoadMoreMessages]);

  // Maintain scroll position when loading older messages
  useEffect(() => {
    if (!loadingMoreMessages && messagesListRef.current && scrollPositionRef.current) {
      const container = messagesListRef.current;
      const savedPosition = scrollPositionRef.current;
      
      // After messages are loaded, adjust scroll position to maintain view (instant, no animation)
      requestAnimationFrame(() => {
        const newScrollHeight = container.scrollHeight;
        const scrollDifference = newScrollHeight - savedPosition.scrollHeight;
        // Use instant scroll (no animation)
        container.scrollTop = savedPosition.scrollTop + scrollDifference;
        scrollPositionRef.current = null;
      });
    }
  }, [messages, loadingMoreMessages]);

  // Scroll to bottom when switching between conversations (instant, no animation)
  useEffect(() => {
    if (conversationId !== undefined && conversationId !== previousConversationIdRef.current) {
      // Conversation changed - set scroll to bottom immediately
      const prevId = previousConversationIdRef.current;
      previousConversationIdRef.current = conversationId;
      setShouldScrollToBottom(true);
      
      // Reset previous messages length when conversation changes
      previousMessagesLengthRef.current = 0;
      
      // Set scroll position to bottom immediately (before messages render)
      // This ensures we start at the bottom without animation
      if (messagesListRef.current) {
        messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
      }
    }
  }, [conversationId]);

  // Ensure we're at bottom when messages first load for a conversation
  useEffect(() => {
    if (conversationId !== undefined && messages.length > 0 && previousMessagesLengthRef.current === 0) {
      // Messages just loaded for this conversation - set to bottom instantly
      requestAnimationFrame(() => {
        if (messagesListRef.current) {
          messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
        }
      });
    }
  }, [conversationId, messages.length]);

  // Ensure scroll is at bottom when component first mounts or conversation changes
  useEffect(() => {
    if (messagesListRef.current && conversationId !== undefined) {
      // Set scroll to bottom immediately on mount or conversation change
      const setScrollToBottom = () => {
        if (messagesListRef.current) {
          messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
        }
      };
      
      // Set immediately
      setScrollToBottom();
      
      // Also set after a brief delay to ensure DOM is ready
      requestAnimationFrame(() => {
        setScrollToBottom();
      });
    }
  }, [conversationId]);

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
      {renderMessagesWithDateBreakers}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

