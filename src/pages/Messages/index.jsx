import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout as logoutApi } from '../../services/authService';
import { clearAuthData, getAuthData } from '../../utils/storage';
import { ROUTES } from '../../constants/routerConstants';
import Sidebar from '../../components/shared/Sidebar';
import Header from '../../components/shared/Header';
import MessagesLayout from '../../components/Messages/MessagesLayout';
import {
  getChatList,
  getMessages,
  sendMessage,
  initializeSignalRConnection,
  startSignalRConnection,
  stopSignalRConnection,
  getSignalRConnection,
} from '../../services/chatService';

const Messages = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('messages');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const signalRConnectionRef = useRef(null);
  const messagesMapRef = useRef({}); // Store messages by chatId

  // Hardcoded receiver ID for testing
  const TEST_RECEIVER_ID = '1c490bd3-e968-4a36-b915-78b64815ba6c';

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Load chat list
  const loadChatList = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await getChatList(user.id);
      if (response.isSuccess && response.data) {
        const formattedConversations = response.data.map((chat) => ({
          id: chat.chatId,
          chatId: chat.chatId,
          name: chat.userName || 'Unknown User',
          lastMessage: chat.lastMessage || '',
          timestamp: formatTimestamp(chat.lastMessageTime),
          userId: chat.userId,
          avatar: chat.userName ? chat.userName.charAt(0).toUpperCase() : 'U',
        }));
        setConversations(formattedConversations);
      }
    } catch (error) {
      console.error('Error loading chat list:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load messages for a chat
  const loadMessages = async (chatId) => {
    if (!chatId || !user?.id) return;
    
    try {
      setLoading(true);
      const response = await getMessages(chatId, user.id, 1, 15);
      if (response.isSuccess && response.data?.messages?.messages) {
        const formattedMessages = response.data.messages.messages.map((msg) => ({
          id: msg.id,
          chatId: msg.chatId,
          sender: msg.author?.user || 'Unknown',
          text: msg.message || '',
          timestamp: formatTimestamp(msg.timeStamp),
          isOwn: msg.sendbyYou || false,
          messageSeen: msg.messageSeen || false,
          status: msg.status?.text || '',
          author: msg.author,
        }));
        
        // Reverse the array so oldest messages are at top and latest at bottom
        const reversedMessages = formattedMessages.reverse();
        
        // Store messages in map
        messagesMapRef.current[chatId] = reversedMessages;
        setMessages(reversedMessages);
        setCurrentChatId(chatId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize SignalR connection for real-time message listening
  useEffect(() => {
    const setupSignalR = async () => {
      if (!user?.id) return;
      
      try {
        const { token } = getAuthData();
        if (!token) return;

        // Initialize SignalR connection with token
        const connection = initializeSignalRConnection(token);
        signalRConnectionRef.current = connection;

        // Listen for 'chatmessages' event (matching backend pattern)
        connection.on('chatmessages', (msg) => {
          console.log('Received message via SignalR:', msg);
          
          // Format message to match our UI structure
          const chatId = msg.chatId;
          const formattedMessage = {
            id: msg.id,
            chatId: msg.chatId,
            sender: msg.author?.user || 'Unknown',
            text: msg.message || '',
            timestamp: formatTimestamp(msg.timeStamp),
            isOwn: msg.sendbyYou || false,
            messageSeen: msg.messageSeen || false,
            status: msg.status?.text || '',
            author: msg.author,
          };
          
          // Initialize chat messages array if it doesn't exist
          if (!messagesMapRef.current[chatId]) {
            messagesMapRef.current[chatId] = [];
          }
          
          // Check if message already exists (avoid duplicates)
          const messageExists = messagesMapRef.current[chatId].some(
            (existingMsg) => existingMsg.id === msg.id
          );
          
          if (!messageExists) {
            // Append new message to the end (latest at bottom)
            messagesMapRef.current[chatId] = [
              ...messagesMapRef.current[chatId],
              formattedMessage,
            ];
            
            // Update current messages if this is the active chat
            if (currentChatId === chatId) {
              setMessages(messagesMapRef.current[chatId]);
            }
            
            // Update conversation list with new last message
            setConversations((prev) => {
              const existingConv = prev.find((conv) => conv.chatId === chatId);
              if (existingConv) {
                return prev.map((conv) =>
                  conv.chatId === chatId
                    ? {
                        ...conv,
                        lastMessage: msg.message || '',
                        timestamp: formatTimestamp(msg.timeStamp),
                      }
                    : conv
                );
              } else {
                // New conversation - add it to the list
                return [
                  {
                    id: chatId,
                    chatId: chatId,
                    name: msg.author?.user || 'Unknown User',
                    lastMessage: msg.message || '',
                    timestamp: formatTimestamp(msg.timeStamp),
                    userId: msg.sendbyYou ? msg.receiverId : msg.senderId,
                    avatar: msg.author?.user
                      ? msg.author.user.charAt(0).toUpperCase()
                      : 'U',
                  },
                  ...prev,
                ];
              }
            });
          }
        });

        // Start the SignalR connection
        await startSignalRConnection(connection);
        console.log('SignalR connection established for real-time messages');
      } catch (error) {
        console.error('Error setting up SignalR:', error);
        console.warn('Real-time messaging unavailable. Messages can still be sent/received via REST API.');
        console.warn('CORS Issue: Backend needs to set Access-Control-Allow-Origin to specific origin (not "*") when credentials are used.');
        // Don't throw - allow the app to continue without SignalR
        // Messages can still be sent/received via REST API
      }
    };

    if (user?.id) {
      setupSignalR();
    }

    return () => {
      if (signalRConnectionRef.current) {
        stopSignalRConnection();
      }
    };
  }, [user?.id, currentChatId]);

  // Load chat list on mount
  useEffect(() => {
    if (user?.id) {
      loadChatList();
    }
  }, [user?.id]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation?.chatId) {
      // Check if we already have messages for this chat
      if (messagesMapRef.current[selectedConversation.chatId]) {
        setMessages(messagesMapRef.current[selectedConversation.chatId]);
        setCurrentChatId(selectedConversation.chatId);
      } else {
        loadMessages(selectedConversation.chatId);
      }
    }
  }, [selectedConversation]);

  const handleLogout = async () => {
    try {
      // Clean up SignalR connection on logout
      if (signalRConnectionRef.current) {
        await stopSignalRConnection();
      }
      const { refreshToken } = getAuthData();
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch (error) {
      // Continue with logout even if API fails
    } finally {
      clearAuthData();
      logout();
      navigate(ROUTES.LOGIN);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !user?.id || sendingMessage) return;

    // For testing, use hardcoded receiver ID if no conversation is selected
    const receiverId = selectedConversation?.userId || TEST_RECEIVER_ID;
    const chatId = selectedConversation?.chatId || null;

    try {
      setSendingMessage(true);
      const response = await sendMessage({
        senderId: user.id,
        receiverId: receiverId,
        message: messageText.trim(),
        chatId: chatId,
        replyToMessageId: null,
      });

      if (response.isSuccess && response.data) {
        // Message sent successfully
        setMessageText('');
        
        // If this is a new chat, reload chat list to get the new chatId
        if (!chatId) {
          await loadChatList();
        } else {
          // Add sent message to current messages (append to end for latest at bottom)
          const formattedMessage = {
            id: response.data.id,
            chatId: response.data.chatId,
            sender: response.data.author?.user || 'You',
            text: response.data.message || '',
            timestamp: formatTimestamp(response.data.timeStamp),
            isOwn: true,
            messageSeen: response.data.messageSeen || false,
            status: response.data.status?.text || '',
            author: response.data.author,
          };
          
          // Append new message to the end (latest at bottom)
          const updatedMessages = [...messages, formattedMessage];
          messagesMapRef.current[response.data.chatId] = updatedMessages;
          setMessages(updatedMessages);
          setCurrentChatId(response.data.chatId);
          
          // Update conversation list
          setConversations((prev) =>
            prev.map((conv) =>
              conv.chatId === response.data.chatId
                ? {
                    ...conv,
                    lastMessage: response.data.message || '',
                    timestamp: formatTimestamp(response.data.timeStamp),
                  }
                : conv
            )
          );
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
  };

  // Select first conversation by default
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  return (
    <div className="dashboard-wrapper">
      <Sidebar 
        activeSection={activeSection}
        onSectionChange={(section) => {
          if (section === 'dashboard') {
            navigate(ROUTES.DASHBOARD);
          } else if (section === 'organizations') {
            navigate(ROUTES.ORGANIZATIONS);
          } else if (section === 'petitions') {
            navigate(ROUTES.PETITIONS);
          } else if (section === 'faq') {
            navigate(ROUTES.FAQ);
          } else if (section === 'training') {
            navigate(ROUTES.TRAINING);
          }
        }}
        onLogout={handleLogout}
      />

      <main className="dashboard-main-area container-fluid messages-main-area">
        <Header 
          user={user}
          pageTitle="Messages"
          onLogout={handleLogout}
        />

        <div className="dashboard-content-section messages-page-content">
          {loading && conversations.length === 0 ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading conversations...</p>
            </div>
          ) : (
            <MessagesLayout
              conversations={conversations}
              selectedConversation={selectedConversation}
              onConversationClick={handleConversationClick}
              messages={messages}
              messageText={messageText}
              setMessageText={setMessageText}
              onSendMessage={handleSendMessage}
              sendingMessage={sendingMessage}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Messages;
