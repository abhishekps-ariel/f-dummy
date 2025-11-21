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
  const [unreadCounts, setUnreadCounts] = useState({}); // Track unread counts per chatId
  const [currentPage, setCurrentPage] = useState({}); // Track current page per chatId
  const [hasMoreMessages, setHasMoreMessages] = useState({}); // Track if more messages available per chatId
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const pageSize = 10; // Number of messages per page

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
          unread: chat.unreadCount || unreadCounts[chat.chatId] || 0, // Use API unread count or state
        }));
        
        // Initialize unread counts from API response if available
        const initialUnreadCounts = {};
        response.data.forEach((chat) => {
          if (chat.unreadCount !== undefined && chat.unreadCount > 0) {
            initialUnreadCounts[chat.chatId] = chat.unreadCount;
          }
        });
        if (Object.keys(initialUnreadCounts).length > 0) {
          setUnreadCounts((prev) => ({ ...prev, ...initialUnreadCounts }));
        }
        const sortedConversations = sortConversationsByLatest(formattedConversations);
        setConversations(sortedConversations);
      }
    } catch (error) {
      console.error('Error loading chat list:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load messages for a chat (with pagination)
  const loadMessages = async (chatId, page = 1, appendToTop = false) => {
    if (!chatId || !user?.id) return;
    
    try {
      if (appendToTop) {
        setLoadingMoreMessages(true);
      } else {
        setLoading(true);
      }
      
      const response = await getMessages(chatId, user.id, page, pageSize);
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
        
        if (appendToTop) {
          // Append older messages to the top
          const existingMessages = messagesMapRef.current[chatId] || [];
          // Filter out duplicates
          const existingIds = new Set(existingMessages.map(m => m.id));
          const newMessages = reversedMessages.filter(m => !existingIds.has(m.id));
          messagesMapRef.current[chatId] = [...newMessages, ...existingMessages];
        } else {
          // Replace all messages (initial load)
          messagesMapRef.current[chatId] = reversedMessages;
        }
        
        setMessages([...messagesMapRef.current[chatId]]);
        setCurrentChatId(chatId);
        currentChatIdRef.current = chatId;
        
        // Update pagination state
        setCurrentPage((prev) => ({
          ...prev,
          [chatId]: page,
        }));
        
        // Check if there are more messages to load
        // If we got a full page of messages, there might be more
        const returnedMessagesCount = formattedMessages.length;
        const hasMore = returnedMessagesCount >= pageSize;
        
        setHasMoreMessages((prev) => ({
          ...prev,
          [chatId]: hasMore,
        }));
        
        // Reset unread count when messages are loaded (conversation is opened)
        if (!appendToTop && unreadCounts[chatId] > 0) {
          setUnreadCounts((prev) => ({
            ...prev,
            [chatId]: 0,
          }));
          // Update conversation unread count in conversations list
          setConversations((prev) =>
            prev.map((conv) =>
              conv.chatId === chatId
                ? { ...conv, unread: 0 }
                : conv
            )
          );
        }
        
        return { hasMore: loadedMessages < totalMessages, scrollToBottom: !appendToTop };
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      return { hasMore: false, scrollToBottom: false };
    } finally {
      setLoading(false);
      setLoadingMoreMessages(false);
    }
  };
  
  // Load more messages (next page)
  const loadMoreMessages = async (chatId) => {
    if (!chatId || loadingMoreMessages || !hasMoreMessages[chatId]) return;
    
    const nextPage = (currentPage[chatId] || 1) + 1;
    await loadMessages(chatId, nextPage, true);
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
      const isOwn = msg.SendbyYou !== undefined ? msg.SendbyYou : (msg.sendbyYou || false);
      
      const formattedMessage = {
        id: messageId,
        chatId: chatId,
        sender: msg.Author?.User || msg.author?.user || 'Unknown',
        text: msg.Message || msg.message || '',
        timestamp: formatTimestamp(msg.TimeStamp || msg.timeStamp),
        isOwn: isOwn,
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
        
        // Determine if we should increment unread count
        // Convert both to strings for consistent comparison
        const currentChatIdStr = currentChatIdRef.current?.toString();
        const msgChatIdStr = chatId?.toString();
        const shouldIncrementUnread = !isOwn && currentChatIdStr !== msgChatIdStr;
        
        // Prepare message data for conversation update
        const msgText = msg.Message || msg.message || '';
        const msgTime = msg.TimeStamp || msg.timeStamp;
        const msgAuthor = msg.Author || msg.author;
        const msgSenderId = msg.SenderId || msg.senderId;
        const msgReceiverId = msg.ReceiverId || msg.receiverId;
        
        // Update unread counts and conversations together
        if (shouldIncrementUnread) {
          // Increment unread count
          setUnreadCounts((prev) => {
            const newCount = (prev[chatId] || 0) + 1;
            
            // Update conversations with the new unread count
            setConversations((prevConvs) => {
              const msgChatIdStr = chatId?.toString();
              const existingConv = prevConvs.find((conv) => {
                const convChatId = conv.chatId?.toString();
                return convChatId === msgChatIdStr;
              });
              
              let updatedConversations;
              if (existingConv) {
                updatedConversations = prevConvs.map((conv) => {
                  const convChatId = conv.chatId?.toString();
                  return convChatId === msgChatIdStr
                    ? {
                        ...conv,
                        lastMessage: msgText,
                        timestamp: formatTimestamp(msgTime),
                        lastMessageTime: msgTime,
                        unread: newCount,
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
                    lastMessageTime: msgTime,
                    userId: isOwn ? msgReceiverId : msgSenderId,
                    avatar: (msgAuthor?.User || msgAuthor?.user)
                      ? (msgAuthor.User || msgAuthor.user).charAt(0).toUpperCase()
                      : 'U',
                    unread: newCount,
                  },
                  ...prevConvs,
                ];
              }
              
              return sortConversationsByLatest(updatedConversations);
            });
            
            return {
              ...prev,
              [chatId]: newCount,
            };
          });
        } else {
          // Update conversations without changing unread count
          setConversations((prev) => {
            const msgChatIdStr = chatId?.toString();
            const currentChatIdStr = currentChatIdRef.current?.toString();
            const existingConv = prev.find((conv) => {
              const convChatId = conv.chatId?.toString();
              return convChatId === msgChatIdStr;
            });
            
            let updatedConversations;
            if (existingConv) {
              updatedConversations = prev.map((conv) => {
                const convChatId = conv.chatId?.toString();
                return convChatId === msgChatIdStr
                  ? {
                      ...conv,
                      lastMessage: msgText,
                      timestamp: formatTimestamp(msgTime),
                      lastMessageTime: msgTime,
                      unread: currentChatIdStr === msgChatIdStr ? 0 : (conv.unread || 0),
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
                  lastMessageTime: msgTime,
                  userId: isOwn ? msgReceiverId : msgSenderId,
                  avatar: (msgAuthor?.User || msgAuthor?.user)
                    ? (msgAuthor.User || msgAuthor.user).charAt(0).toUpperCase()
                    : 'U',
                  unread: 0,
                },
                ...prev,
              ];
            }
            
            return sortConversationsByLatest(updatedConversations);
          });
        }
        
        if (currentChatIdRef.current === chatId) {
          setMessages([...messagesMapRef.current[chatId]]);
        }
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
      const chatId = selectedConversation.chatId;
      // Check if we already have messages for this chat
      if (messagesMapRef.current[chatId] && messagesMapRef.current[chatId].length > 0) {
        setMessages(messagesMapRef.current[chatId]);
        setCurrentChatId(chatId);
        currentChatIdRef.current = chatId;
      } else {
        // Load initial page (page 1)
        loadMessages(chatId, 1, false);
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
                    unread: conv.unread || 0, // Preserve unread count
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
    // Reset unread count when conversation is opened
    if (conversation.chatId && unreadCounts[conversation.chatId] > 0) {
      setUnreadCounts((prev) => ({
        ...prev,
        [conversation.chatId]: 0,
      }));
      // Update conversation unread count in conversations list
      setConversations((prev) =>
        prev.map((conv) =>
          conv.chatId === conversation.chatId
            ? { ...conv, unread: 0 }
            : conv
        )
      );
    }
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
            conversations={conversations.map((conv) => ({
              ...conv,
              unread: unreadCounts[conv.chatId] !== undefined 
                ? unreadCounts[conv.chatId] 
                : (conv.unread || 0),
            }))}
            selectedConversation={selectedConversation}
            onConversationClick={handleConversationClick}
              messages={messages}
            messageText={messageText}
            setMessageText={setMessageText}
            onSendMessage={handleSendMessage}
              sendingMessage={sendingMessage}
            onLoadMoreMessages={() => loadMoreMessages(currentChatId)}
            hasMoreMessages={currentChatId ? (hasMoreMessages[currentChatId] || false) : false}
            loadingMoreMessages={loadingMoreMessages}
          />
          )}
        </div>
      </main>
    </div>
  );
};

export default Messages;
