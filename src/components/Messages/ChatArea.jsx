import React from 'react';
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
  loadingMoreMessages
}) => {
  if (!selectedConversation) {
    return (
      <div className="chat-placeholder">
        <i className="fas fa-comments fa-3x text-muted mb-3"></i>
        <h5>Select a conversation</h5>
        <p className="text-muted">Choose a conversation from the list to start messaging</p>
      </div>
    );
  }

  return (
    <>
      <ChatHeader conversation={selectedConversation} />
      <MessageList 
        messages={messages} 
        conversationAvatar={selectedConversation.avatar}
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

