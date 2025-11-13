import React from 'react';

const ChatHeader = ({ conversation }) => {
  if (!conversation) return null;

  return (
    <div className="chat-header">
      <div className="chat-header-info">
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

