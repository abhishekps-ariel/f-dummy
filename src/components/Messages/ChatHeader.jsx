import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

const ChatHeader = memo(({ conversation, onBack }) => {
  const { t } = useTranslation();
  
  if (!conversation) return null;

  return (
    <div className="chat-header">
      <div className="chat-header-info">
        {onBack && (
          <button
            className="chat-back-btn"
            onClick={onBack}
            aria-label={t("messages.backToConversations")}
            title={t("messages.backToConversations")}
          >
            <i className="fas fa-arrow-left"></i>
          </button>
        )}
        <div className="chat-avatar">{conversation.avatar}</div>
        <div>
          <h4 className="chat-name">{conversation.name}</h4>
          {conversation.email && (
            <span className="chat-status">{conversation.email}</span>
          )}
        </div>
      </div>
    </div>
  );
});

ChatHeader.displayName = 'ChatHeader';

export default ChatHeader;

