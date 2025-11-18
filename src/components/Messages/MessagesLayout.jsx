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
  sendingMessage
}) => {
  return (
    <div className="messages-container">
      <div className="messages-layout">
        <ConversationsSidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          onConversationClick={onConversationClick}
        />
        <div className="chat-area">
          <ChatArea
            selectedConversation={selectedConversation}
            messages={messages}
            messageText={messageText}
            setMessageText={setMessageText}
            onSendMessage={onSendMessage}
            sendingMessage={sendingMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default MessagesLayout;

