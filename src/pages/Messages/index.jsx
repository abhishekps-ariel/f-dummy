import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout as logoutApi } from '../../services/authService';
import { clearAuthData, getAuthData } from '../../utils/storage';
import { ROUTES } from '../../constants/routerConstants';
import Sidebar from '../../components/shared/Sidebar';
import Header from '../../components/shared/Header';
import MessagesLayout from '../../components/Messages/MessagesLayout';

const Messages = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('messages');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');

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
          <MessagesLayout
            conversations={conversations}
            selectedConversation={selectedConversation}
            onConversationClick={handleConversationClick}
            messages={currentMessages}
            messageText={messageText}
            setMessageText={setMessageText}
            onSendMessage={handleSendMessage}
          />
        </div>
      </main>
    </div>
  );
};

export default Messages;
