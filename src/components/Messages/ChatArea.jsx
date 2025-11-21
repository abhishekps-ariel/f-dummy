import React from 'react';
import { useTranslation } from 'react-i18next';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatArea = ({ 
  selectedConversation, 
  messages, 
  messageText, 
  setMessageText, 
  onSendMessage, 
  sendingMessage,
  onLoadMoreMessages,
  hasMoreMessages,
  loadingMoreMessages,
  onBack
}) => {
  const { t } = useTranslation();
  
  if (!selectedConversation) {
    return (
      <div className="chat-placeholder">
        <i className="fas fa-comments fa-3x text-muted mb-3"></i>
        <h5>{t("messages.selectConversation")}</h5>
        <p className="text-muted">{t("messages.chooseConversation")}</p>
      </div>
    );
  }

  return (
    <>
      <ChatHeader conversation={selectedConversation} onBack={onBack} />
      <MessageList 
        messages={messages} 
        conversationAvatar={selectedConversation.avatar}
        conversationId={selectedConversation.chatId}
        onLoadMoreMessages={onLoadMoreMessages}
        hasMoreMessages={hasMoreMessages}
        loadingMoreMessages={loadingMoreMessages}
      />
      <MessageInput
        messageText={messageText}
        setMessageText={setMessageText}
        onSendMessage={onSendMessage}
        sendingMessage={sendingMessage}
      />
    </>
  );
};

export default ChatArea;

