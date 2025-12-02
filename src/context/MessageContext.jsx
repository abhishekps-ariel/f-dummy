import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AuthContext from './AuthContext';
import { createSignalRConnection, getChatList } from '../services/chatService';

const MessageContext = createContext();

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider = ({ children }) => {
  // Safely get auth context with fallback
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  const signalRConnectionRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const isInitializedRef = useRef(false);

  // Helper function to update total unread count in localStorage
  const updateUnreadCountInStorage = async () => {
    if (!user?.id) return;
    
    try {
      const response = await getChatList(user.id);
      if (response.isSuccess && response.data) {
        const totalUnread = response.data.reduce((sum, chat) => {
          return sum + (chat.unreadCount || 0);
        }, 0);
        localStorage.setItem('messagesUnreadCount', totalUnread.toString());
        // Dispatch a custom event to notify other components
        window.dispatchEvent(new CustomEvent('messagesUnreadCountUpdated', { detail: totalUnread }));
      }
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  };

  // Initialize SignalR connection
  useEffect(() => {
    if (!user?.id || isInitializedRef.current) return;

    // Don't create multiple connections
    if (signalRConnectionRef.current) {
      return;
    }

    const conn = createSignalRConnection(user.id);
    signalRConnectionRef.current = conn;
    isInitializedRef.current = true;

    // Set up message handler
    conn.on('chatmessages', (msg) => {
      const isOwn = msg.SendbyYou !== undefined ? msg.SendbyYou : (msg.sendbyYou || false);
      const chatId = msg.ChatId || msg.chatId;
      
      // Only increment unread count if message is not from current user
      if (!isOwn) {
        // Get current unread counts from localStorage or fetch fresh
        const currentCount = parseInt(localStorage.getItem('messagesUnreadCount') || '0', 10);
        const newCount = currentCount + 1;
        localStorage.setItem('messagesUnreadCount', newCount.toString());
        
        // Dispatch custom event immediately for instant UI update
        window.dispatchEvent(new CustomEvent('messagesUnreadCountUpdated', { detail: newCount }));
        
        // Also fetch fresh count from API to ensure accuracy
        updateUnreadCountInStorage();
      }
    });

    // Handle connection events
    conn.onclose(() => {
      setIsConnected(false);
    });

    conn.onreconnecting(() => {
      setIsConnected(false);
    });

    conn.onreconnected(() => {
      setIsConnected(true);
      // Refresh unread count after reconnection
      updateUnreadCountInStorage();
    });

    // Start connection
    conn.start()
      .then(() => {
        setIsConnected(true);
        // Load initial unread count
        updateUnreadCountInStorage();
      })
      .catch((error) => {
        console.error('Error starting SignalR connection (global):', error);
        setIsConnected(false);
      });

    // Cleanup on unmount
    return () => {
      if (signalRConnectionRef.current) {
        signalRConnectionRef.current.stop()
          .then(() => {
          })
          .catch((error) => {
            console.error('Error stopping SignalR connection (global):', error);
          });
        signalRConnectionRef.current = null;
        isInitializedRef.current = false;
        setIsConnected(false);
      }
    };
  }, [user?.id]);

  // Update unread count periodically (as a fallback)
  useEffect(() => {
    if (!user?.id) return;

    // Initial load
    updateUnreadCountInStorage();

    // Update every 30 seconds as a fallback
    const interval = setInterval(() => {
      updateUnreadCountInStorage();
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const value = {
    isConnected,
    updateUnreadCount: updateUnreadCountInStorage,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

