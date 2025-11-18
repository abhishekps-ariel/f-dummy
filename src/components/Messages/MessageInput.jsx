import React from 'react';
import CustomInput from '../shared/CustomInput';
import sendIcon from '../../assets/sendIcon.png';

const MessageInput = ({ messageText, setMessageText, onSendMessage, sendingMessage = false }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sendingMessage && messageText.trim()) {
      onSendMessage(e);
    }
  };

  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit} className="message-input-form">
        <CustomInput
          type="text"
          className="message-input-custom"
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          autoComplete="off"
          disabled={sendingMessage}
        />
        <button
          type="submit"
          className={`message-send-btn ${messageText.trim() && !sendingMessage ? 'active' : ''}`}
          disabled={!messageText.trim() || sendingMessage}
        >
          {sendingMessage ? (
            <div className="spinner-border spinner-border-sm text-white" role="status">
              <span className="visually-hidden">Sending...</span>
            </div>
          ) : (
            <img src={sendIcon} alt="Send" className="send-icon-img" />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;

