import React from 'react';

const ChatHeader = ({ conversation, onBack }) => {
  if (!conversation) return null;

  return (
    <div className="chat-header">
      <div className="chat-header-info">
        {onBack && (
          <button
            className="chat-back-btn"
            onClick={onBack}
            aria-label="Back to conversations"
            title="Back to conversations"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
        )}
        <div className="chat-avatar">{conversation.avatar}</div>
        <div>
          <h4 className="chat-name">{conversation.name}</h4>
          <span className="chat-status">Active</span>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;

