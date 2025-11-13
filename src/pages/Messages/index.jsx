import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout as logoutApi } from '../../services/authService';
import { clearAuthData, getAuthData } from '../../utils/storage';
import { ROUTES } from '../../constants/routerConstants';
import Sidebar from '../../components/shared/Sidebar';
import Header from '../../components/shared/Header';
import NoOrganizationAccess from '../../components/Petitions/NoOrganizationAccess';
import './Messages.css';

const Messages = () => {
  const { user, logout, hasOrganizationAccess, organizationCheckComplete } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('messages');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  // Static conversation data
  const [conversations] = useState([
    {
      id: 1,
      name: 'John Smith',
      lastMessage: 'Thanks for the update on the petition.',
      timestamp: '2:30 PM',
      unread: 2,
      avatar: 'JS'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      lastMessage: 'Can you review the filing entity details?',
      timestamp: '1:15 PM',
      unread: 0,
      avatar: 'SJ'
    },
    {
      id: 3,
      name: 'Michael Chen',
      lastMessage: 'The borrower information looks good.',
      timestamp: 'Yesterday',
      unread: 1,
      avatar: 'MC'
    },
    {
      id: 4,
      name: 'Legal Team',
      lastMessage: 'Meeting scheduled for tomorrow at 3 PM',
      timestamp: 'Yesterday',
      unread: 0,
      avatar: 'LT'
    },
    {
      id: 5,
      name: 'Emily Davis',
      lastMessage: 'Please confirm the loan details.',
      timestamp: '2 days ago',
      unread: 0,
      avatar: 'ED'
    }
  ]);

  // Static messages data
  const [messages] = useState({
    1: [
      {
        id: 1,
        sender: 'John Smith',
        text: 'Hi, I need to discuss the foreclosure petition filing.',
        timestamp: '2:15 PM',
        isOwn: false
      },
      {
        id: 2,
        sender: 'You',
        text: 'Sure, what would you like to know?',
        timestamp: '2:20 PM',
        isOwn: true
      },
      {
        id: 3,
        sender: 'John Smith',
        text: 'Thanks for the update on the petition.',
        timestamp: '2:30 PM',
        isOwn: false
      }
    ],
    2: [
      {
        id: 1,
        sender: 'Sarah Johnson',
        text: 'Can you review the filing entity details?',
        timestamp: '1:15 PM',
        isOwn: false
      }
    ],
    3: [
      {
        id: 1,
        sender: 'Michael Chen',
        text: 'The borrower information looks good.',
        timestamp: 'Yesterday',
        isOwn: false
      }
    ],
    4: [
      {
        id: 1,
        sender: 'Legal Team',
        text: 'Meeting scheduled for tomorrow at 3 PM',
        timestamp: 'Yesterday',
        isOwn: false
      }
    ],
    5: [
      {
        id: 1,
        sender: 'Emily Davis',
        text: 'Please confirm the loan details.',
        timestamp: '2 days ago',
        isOwn: false
      }
    ]
  });

  const handleLogout = async () => {
    try {
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageText.trim() && selectedConversation) {
      // In a real implementation, this would send to API
      // For now, just clear the input
      setMessageText('');
    }
  };

  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversation, messageText]);

  // Select first conversation by default
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  const currentMessages = selectedConversation ? messages[selectedConversation.id] || [] : [];

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
          {!organizationCheckComplete ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Checking organization access...</p>
            </div>
          ) : !hasOrganizationAccess ? (
            <NoOrganizationAccess />
          ) : (
            <div className="messages-container">
              <div className="messages-layout">
                {/* Conversations Sidebar */}
                <div className="conversations-sidebar">
                  <div className="conversations-header">
                    <h3 className="conversations-title">Conversations</h3>
                  </div>
                  <div className="conversations-list">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`conversation-item ${
                          selectedConversation?.id === conversation.id ? 'active' : ''
                        }`}
                        onClick={() => handleConversationClick(conversation)}
                      >
                        <div className="conversation-avatar">
                          {conversation.avatar}
                        </div>
                        <div className="conversation-content">
                          <div className="conversation-header-row">
                            <span className="conversation-name">{conversation.name}</span>
                            <span className="conversation-time">{conversation.timestamp}</span>
                          </div>
                          <div className="conversation-preview-row">
                            <span className="conversation-preview">{conversation.lastMessage}</span>
                            {conversation.unread > 0 && (
                              <span className="conversation-unread">{conversation.unread}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat Area */}
                <div className="chat-area">
                  {selectedConversation ? (
                    <>
                      {/* Chat Header */}
                      <div className="chat-header">
                        <div className="chat-header-info">
                          <div className="chat-avatar">{selectedConversation.avatar}</div>
                          <div>
                            <h4 className="chat-name">{selectedConversation.name}</h4>
                            <span className="chat-status">Active</span>
                          </div>
                        </div>
                      </div>

                      {/* Messages List */}
                      <div className="messages-list">
                        {currentMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`message-item ${message.isOwn ? 'own-message' : 'other-message'}`}
                          >
                            {!message.isOwn && (
                              <div className="message-avatar">{selectedConversation.avatar}</div>
                            )}
                            <div className="message-content">
                              {!message.isOwn && (
                                <div className="message-sender">{message.sender}</div>
                              )}
                              <div className="message-bubble">
                                <p className="message-text">{message.text}</p>
                                <span className="message-time">{message.timestamp}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Message Input */}
                      <div className="message-input-container">
                        <form onSubmit={handleSendMessage} className="message-input-form">
                          <input
                            type="text"
                            className="message-input"
                            placeholder="Type a message..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                          />
                          <button
                            type="submit"
                            className={`message-send-btn ${messageText.trim() ? 'active' : ''}`}
                            disabled={!messageText.trim()}
                          >
                            <i className="fas fa-paper-plane"></i>
                          </button>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="chat-placeholder">
                      <i className="fas fa-comments fa-3x text-muted mb-3"></i>
                      <h5>Select a conversation</h5>
                      <p className="text-muted">Choose a conversation from the list to start messaging</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Messages;
