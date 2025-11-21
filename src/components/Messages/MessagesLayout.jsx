import React from 'react';
import ConversationsSidebar from './ConversationsSidebar';
import ChatArea from './ChatArea';
import './Messages.css';

const MessagesLayout = ({
  conversations,
  selectedConversation,
  onConversationClick,
  messages,
  messageText,
  setMessageText,
  onSendMessage,
  sendingMessage,
  onLoadMoreMessages,
  hasMoreMessages,
  loadingMoreMessages
}) => {
  const handleBack = () => {
    // Close the conversation by clicking it again (toggles it closed)
    if (selectedConversation) {
      onConversationClick(selectedConversation);
    }
  };

  return (
    <div className="messages-container">
      <div className={`messages-layout ${selectedConversation ? 'mobile-chat-open' : ''}`}>
        <ConversationsSidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          onConversationClick={onConversationClick}
        />
        <div className={`chat-area ${selectedConversation ? 'chat-area-open' : ''}`}>
          <ChatArea
            selectedConversation={selectedConversation}
            messages={messages}
            messageText={messageText}
            setMessageText={setMessageText}
            onSendMessage={onSendMessage}
            sendingMessage={sendingMessage}
            onLoadMoreMessages={onLoadMoreMessages}
            hasMoreMessages={hasMoreMessages}
            loadingMoreMessages={loadingMoreMessages}
            onBack={handleBack}
          />
        </div>
      </div>
    </div>
  );
};

export default MessagesLayout;

