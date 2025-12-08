/**
 * Message handling helpers
 */

import { getChatList, getMessages, sendMessage, markAsRead } from '../../services/chatService';
import { STORAGE_KEYS } from '../../constants/appConstants';
import { formatTimestamp, getInitials, sortConversationsByLatest } from './messageUtils';

/**
 * Load chat list for a user
 * @param {string} userId - User ID
 * @param {Function} t - Translation function
 * @param {Object} unreadCounts - Current unread counts state
 * @returns {Promise<Object>} Object with conversations and unreadCounts
 */
export const loadChatList = async (userId, t, unreadCounts = {}) => {
  if (!userId) return { conversations: [], unreadCounts: {} };
  
  try {
    const response = await getChatList(userId);
    if (response.isSuccess && response.data) {
      const formattedConversations = response.data.map((chat) => ({
        id: chat.chatId,
        chatId: chat.chatId,
        name: chat.userName || t("messages.unknownUser"),
        email: chat.email || '',
        lastMessage: chat.lastMessage || '',
        timestamp: formatTimestamp(chat.lastMessageTime, t),
        lastMessageTime: chat.lastMessageTime,
        userId: chat.userId,
        avatar: getInitials(chat.userName),
        unread: chat.unreadCount || unreadCounts[chat.chatId] || 0,
      }));
      
      // Initialize unread counts from API response
      const initialUnreadCounts = {};
      response.data.forEach((chat) => {
        if (chat.unreadCount !== undefined && chat.unreadCount > 0) {
          initialUnreadCounts[chat.chatId] = chat.unreadCount;
        }
      });
      
      const sortedConversations = sortConversationsByLatest(formattedConversations);
      
      // Update total unread count in localStorage for sidebar badge
      const totalUnread = Object.values(initialUnreadCounts).reduce((sum, count) => sum + count, 0);
      sessionStorage.setItem(STORAGE_KEYS.MESSAGES_UNREAD_COUNT, totalUnread.toString());
      
      return {
        conversations: sortedConversations,
        unreadCounts: initialUnreadCounts,
      };
    }
    return { conversations: [], unreadCounts: {} };
  } catch (err) {
    throw new Error(err?.message || t("messages.errorLoadingChatList") || "Failed to load chat list. Please try again.");
  }
};

/**
 * Load messages for a chat with pagination
 * @param {string} chatId - Chat ID
 * @param {string} userId - User ID
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Page size (default: 25)
 * @returns {Promise<Object>} Object with messages, hasMore, and totalMessages
 */
export const loadMessagesForChat = async (chatId, userId, page = 1, pageSize = 25) => {
  if (!chatId || !userId) return { messages: [], hasMore: false, totalMessages: 0 };
  
  try {
    const response = await getMessages(chatId, userId, page, pageSize);
    if (response.isSuccess && response.data?.messages) {
      const formattedMessages = response.data.messages.messages.map((msg) => ({
        id: msg.messageId || msg.id,
        text: msg.messageText || msg.text || '',
        senderId: msg.senderId || msg.senderUserId,
        receiverId: msg.receiverId || msg.receiverUserId,
        timestamp: msg.sentAt || msg.timestamp || msg.createdAt,
        originalTimestamp: msg.sentAt || msg.timestamp || msg.createdAt,
        isRead: msg.isRead || false,
      }));
      
      const reversedMessages = formattedMessages.reverse();
      const totalMessages = response.data.messages.totalMessages || 0;
      const hasMore = reversedMessages.length < totalMessages;
      
      return {
        messages: reversedMessages,
        hasMore,
        totalMessages,
      };
    }
    return { messages: [], hasMore: false, totalMessages: 0 };
  } catch (err) {
    throw new Error(err?.message || "Failed to load messages. Please try again.");
  }
};

/**
 * Send a message
 * @param {string} chatId - Chat ID
 * @param {string} senderId - Sender user ID
 * @param {string} receiverId - Receiver user ID
 * @param {string} messageText - Message text
 * @returns {Promise<Object>} Sent message object
 */
export const sendChatMessage = async (chatId, senderId, receiverId, messageText) => {
  if (!chatId || !senderId || !receiverId || !messageText.trim()) {
    throw new Error("Missing required parameters");
  }
  
  try {
    const response = await sendMessage(chatId, senderId, receiverId, messageText);
    if (response.isSuccess && response.data) {
      return {
        id: response.data.messageId || response.data.id,
        text: messageText,
        senderId,
        receiverId,
        timestamp: new Date().toISOString(),
        originalTimestamp: new Date().toISOString(),
        isRead: false,
      };
    }
    throw new Error(response.msg || "Failed to send message");
  } catch (err) {
    throw new Error(err?.message || "Failed to send message. Please try again.");
  }
};

/**
 * Mark messages as read
 * @param {string} chatId - Chat ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if successful
 */
export const markMessagesAsRead = async (chatId, userId) => {
  if (!chatId || !userId) return false;
  
  try {
    const response = await markAsRead(chatId, userId);
    return response.isSuccess || false;
  } catch {
    return false;
  }
};

