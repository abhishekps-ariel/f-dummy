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
  createSignalRConnection,
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
  const currentChatIdRef = useRef(null);
  const signalRConnectionRef = useRef(null);
  const messagesMapRef = useRef({});

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

  // Sort conversations by latest message time (descending)
  const sortConversationsByLatest = (conversations) => {
    return [...conversations].sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA; // Latest first (descending order)
    });
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
          lastMessageTime: chat.lastMessageTime, // Store original timestamp for sorting
          userId: chat.userId,
          avatar: chat.userName ? chat.userName.charAt(0).toUpperCase() : 'U',
        }));
        const sortedConversations = sortConversationsByLatest(formattedConversations);
        setConversations(sortedConversations);
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
        currentChatIdRef.current = chatId;
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    
    if (signalRConnectionRef.current) {
      return;
    }

    const conn = createSignalRConnection(user.id);
    signalRConnectionRef.current = conn;
    
    let isMounted = true;

    conn.on('chatmessages', (msg) => {
      if (!isMounted) return;
      
      console.log('SignalR message received:', msg);
      
      const chatId = msg.ChatId || msg.chatId;
      const messageId = msg.Id || msg.id;
      const formattedMessage = {
        id: messageId,
        chatId: chatId,
        sender: msg.Author?.User || msg.author?.user || 'Unknown',
        text: msg.Message || msg.message || '',
        timestamp: formatTimestamp(msg.TimeStamp || msg.timeStamp),
        isOwn: msg.SendbyYou !== undefined ? msg.SendbyYou : (msg.sendbyYou || false),
        messageSeen: msg.MessageSeen !== undefined ? msg.MessageSeen : (msg.messageSeen || false),
        status: msg.Status?.Text || msg.status?.text || '',
        author: msg.Author || msg.author,
      };
      
      if (!messagesMapRef.current[chatId]) {
        messagesMapRef.current[chatId] = [];
      }
      
      const messageExists = messagesMapRef.current[chatId].some(
        (existingMsg) => existingMsg.id === messageId
      );
      
      if (!messageExists) {
        messagesMapRef.current[chatId] = [
          ...messagesMapRef.current[chatId],
          formattedMessage,
        ];
        
        if (currentChatIdRef.current === chatId) {
          setMessages([...messagesMapRef.current[chatId]]);
        }
        
        setConversations((prev) => {
          const msgText = msg.Message || msg.message || '';
          const msgTime = msg.TimeStamp || msg.timeStamp;
          const msgAuthor = msg.Author || msg.author;
          const msgSenderId = msg.SenderId || msg.senderId;
          const msgReceiverId = msg.ReceiverId || msg.receiverId;
          const isOwn = msg.SendbyYou !== undefined ? msg.SendbyYou : (msg.sendbyYou || false);
          
          const existingConv = prev.find((conv) => {
            const convChatId = conv.chatId?.toString();
            const msgChatId = chatId?.toString();
            return convChatId === msgChatId;
          });
          
          let updatedConversations;
          if (existingConv) {
            updatedConversations = prev.map((conv) => {
              const convChatId = conv.chatId?.toString();
              const msgChatId = chatId?.toString();
              return convChatId === msgChatId
                ? {
                    ...conv,
                    lastMessage: msgText,
                    timestamp: formatTimestamp(msgTime),
                    lastMessageTime: msgTime, // Update timestamp for sorting
                  }
                : conv;
            });
          } else {
            updatedConversations = [
              {
                id: chatId,
                chatId: chatId,
                name: msgAuthor?.User || msgAuthor?.user || 'Unknown User',
                lastMessage: msgText,
                timestamp: formatTimestamp(msgTime),
                lastMessageTime: msgTime, // Store timestamp for sorting
                userId: isOwn ? msgReceiverId : msgSenderId,
                avatar: (msgAuthor?.User || msgAuthor?.user)
                  ? (msgAuthor.User || msgAuthor.user).charAt(0).toUpperCase()
                  : 'U',
              },
              ...prev,
            ];
          }
          
          // Sort by latest message time
          return sortConversationsByLatest(updatedConversations);
        });
      }
    });

    conn.start()
      .then(() => {
        console.log('SignalR connected successfully');
        if (!isMounted) {
          conn.stop().catch(() => {});
        }
      })
      .catch((err) => {
        console.error('SignalR connection error:', err);
      });

    return () => {
      isMounted = false;
      if (signalRConnectionRef.current === conn) {
        conn.off('chatmessages');
        conn.stop().catch(() => {});
        signalRConnectionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
        currentChatIdRef.current = selectedConversation.chatId;
      } else {
        loadMessages(selectedConversation.chatId);
      }
    }
  }, [selectedConversation]);

  const handleLogout = async () => {
    try {
      if (signalRConnectionRef.current) {
        signalRConnectionRef.current.stop().catch(() => {});
        signalRConnectionRef.current = null;
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
          currentChatIdRef.current = response.data.chatId;
          
          // Update conversation list
          setConversations((prev) => {
            const updatedConversations = prev.map((conv) =>
              conv.chatId === response.data.chatId
                ? {
                    ...conv,
                    lastMessage: response.data.message || '',
                    timestamp: formatTimestamp(response.data.timeStamp),
                    lastMessageTime: response.data.timeStamp, // Update timestamp for sorting
                  }
                : conv
            );
            // Sort by latest message time
            return sortConversationsByLatest(updatedConversations);
          });
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
