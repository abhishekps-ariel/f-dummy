import React from 'react';

const MessageInput = ({ messageText, setMessageText, onSendMessage }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSendMessage(e);
  };

  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit} className="message-input-form">
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
  );
};

export default MessageInput;

