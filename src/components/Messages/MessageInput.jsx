import React, { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import CustomInput from '../shared/CustomInput';
import sendIcon from '../../assets/sendIcon.png';

const MessageInput = memo(({ messageText, setMessageText, onSendMessage, sendingMessage = false }) => {
  const { t } = useTranslation();
  
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!sendingMessage && messageText.trim()) {
      onSendMessage(e);
    }
  }, [sendingMessage, messageText, onSendMessage]);

  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit} className="message-input-form">
        <CustomInput
          type="text"
          className="message-input-custom"
          placeholder={t("messages.typeMessage")}
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
              <span className="visually-hidden">{t("messages.sending")}</span>
            </div>
          ) : (
            <img src={sendIcon} alt={t("messages.send")} className="send-icon-img" />
          )}
        </button>
      </form>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput;

