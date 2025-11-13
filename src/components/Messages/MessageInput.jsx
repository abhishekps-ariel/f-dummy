import React from 'react';
import CustomInput from '../shared/CustomInput';
import sendIcon from '../../assets/sendIcon.png';

const MessageInput = ({ messageText, setMessageText, onSendMessage }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSendMessage(e);
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
        />
        <button
          type="submit"
          className={`message-send-btn ${messageText.trim() ? 'active' : ''}`}
          disabled={!messageText.trim()}
        >
          <img src={sendIcon} alt="Send" className="send-icon-img" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;

