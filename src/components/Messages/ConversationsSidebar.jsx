import React from 'react';

const ConversationsSidebar = ({ conversations, selectedConversation, onConversationClick }) => {
  return (
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
        ))}
      </div>
    </div>
  );
};

export default ConversationsSidebar;

