import React, { memo } from 'react';

const MessageItem = memo(({ message, conversationAvatar }) => {
  return (
    <div className={`message-item ${message.isOwn ? 'own-message' : 'other-message'}`}>
      {!message.isOwn && (
        <div className="message-avatar">{conversationAvatar}</div>
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
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;

