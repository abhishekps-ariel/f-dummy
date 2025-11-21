import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CustomInput from '../shared/CustomInput';

const ConversationsSidebar = ({ conversations, selectedConversation, onConversationClick }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conversation) => {
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
        <div className="conversations-search">
          <CustomInput
            type="text"
            placeholder={t("messages.searchConversations")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            className="conversations-search-input"
          />
          <i className="fas fa-search conversations-search-icon"></i>
        </div>
      </div>
      <div className="conversations-list">
        {filteredConversations.length > 0 ? (
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

