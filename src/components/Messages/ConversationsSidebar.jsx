import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import CustomInput from '../shared/CustomInput';
import { useDebounce } from '../../hooks/useDebounce';
import { getChatUserList } from '../../services/chatService';
import { getInitials } from '../../helpers/messages/messageUtils';

const ConversationsSidebar = ({ conversations, selectedConversation, onConversationClick, userId, onUserSelect }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const searchContainerRef = useRef(null);

  // Call API when search query changes (debounced)
  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedSearchQuery.trim() || !userId) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await getChatUserList(userId, debouncedSearchQuery);
        if (response.isSuccess && response.data) {
          setSearchResults(response.data);
          setShowSearchResults(true);
        } else {
          setSearchResults([]);
          setShowSearchResults(false);
        }
      } catch {
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        setIsSearching(false);
      }
    };

    searchUsers();
  }, [debouncedSearchQuery, userId]);

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle user selection from search results
  const handleUserSelect = (user) => {
    if (onUserSelect) {
      onUserSelect(user);
    }
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Filter conversations based on search query (only if not searching for new users)
  const filteredConversations = showSearchResults ? [] : conversations.filter((conversation) => {
    const query = searchQuery.toLowerCase();
    return (
      conversation.name.toLowerCase().includes(query) ||
      conversation.lastMessage.toLowerCase().includes(query)
    );
  });

  return (
    <div className="conversations-sidebar">
      <div className="conversations-header">
        <h3 className="conversations-title">{t("messages.conversations")}</h3>
        <div className="conversations-search" ref={searchContainerRef} style={{ position: 'relative' }}>
          <CustomInput
            type="text"
            placeholder={t("messages.searchUsersOrConversations")}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value.trim()) {
                setShowSearchResults(false);
              }
            }}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowSearchResults(true);
              }
            }}
            autoComplete="off"
            className="conversations-search-input"
          />
          <i className="fas fa-search conversations-search-icon"></i>
          
          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="search-results-dropdown">
              {isSearching ? (
                <div className="search-results-loading">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">{t("common.loading")}</span>
                  </div>
                  <span>{t("common.loading")}</span>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="search-results-header">
                    <span>{t("messages.searchResults")}</span>
                  </div>
                  <div className="search-results-list">
                    {searchResults.map((user, index) => {
                      const initials = getInitials(user.userName || user.name);
                      return (
                        <div
                          key={user.userId || user.id}
                          className="search-result-item"
                          onClick={() => handleUserSelect(user)}
                        >
                          <div className="search-result-avatar">
                            {initials}
                          </div>
                          <div className="search-result-content">
                            <div className="search-result-name">
                              {user.userName || user.name || t("messages.unknownUser")}
                            </div>
                            {user.email && (
                              <div className="search-result-email">
                                {user.email}
                              </div>
                            )}
                          </div>
                          <div className="search-result-arrow">
                            <i className="fas fa-chevron-right"></i>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="search-results-empty">
                  <i className="fas fa-user-slash"></i>
                  <p>{t("messages.noUsersFound")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="conversations-list">
        {showSearchResults ? null : filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`conversation-item ${
                selectedConversation?.id === conversation.id ? 'active' : ''
              } ${
                conversation.unread > 0 ? 'unread' : ''
              }`}
              onClick={() => onConversationClick(conversation)}
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
          ))
        ) : (
          <div className="conversations-empty">
            <p className="conversations-empty-text">{t("messages.noConversationsFound")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsSidebar;

