/**
 * Message formatting and utility functions
 */

import { STORAGE_KEYS } from '../../constants/appConstants';

/**
 * Get unread message count from sessionStorage
 * @returns {number} Unread message count, defaults to 0 if not found or on error
 */
export const getUnreadMessageCount = () => {
  try {
    const count = sessionStorage.getItem(STORAGE_KEYS.MESSAGES_UNREAD_COUNT);
    return count ? parseInt(count, 10) : 0;
  } catch {
    return 0;
  }
};

/**
 * Get user initials from a name (first letter of first name and first letter of last name)
 * @param {string} name - Full name
 * @returns {string} Two-letter initials or 'U' if invalid
 */
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'U';
  
  const trimmedName = name.trim();
  if (!trimmedName) return 'U';
  
  const parts = trimmedName.split(/\s+/).filter(part => part.length > 0);
  
  if (parts.length === 0) return 'U';
  
  if (parts.length === 1) {
    // Only one word, return first letter
    return parts[0].charAt(0).toUpperCase();
  }
  
  // Two or more words: return first letter of first word and first letter of last word
  const firstInitial = parts[0].charAt(0).toUpperCase();
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
};

/**
 * Format timestamp for display in conversation list
 * @param {string|Date} timestamp - Timestamp to format
 * @param {Function} t - Translation function
 * @returns {string} Formatted timestamp
 */
export const formatTimestamp = (timestamp, t) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } else if (diffInHours < 48) {
    return t ? t("messages.yesterday") : 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

/**
 * Format message time (only time, no date - date breakers handle dates)
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Formatted time
 */
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

/**
 * Sort conversations by latest message time (descending)
 * @param {Array} conversations - Array of conversation objects
 * @returns {Array} Sorted conversations
 */
export const sortConversationsByLatest = (conversations) => {
  return [...conversations].sort((a, b) => {
    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
    return timeB - timeA; // Latest first (descending order)
  });
};

/**
 * Get date label for date breakers in message list
 * @param {string|Date} timestamp - Timestamp to format
 * @param {Function} t - Translation function
 * @returns {string|null} Date label or null
 */
export const getDateLabel = (timestamp, t) => {
  if (!timestamp) return null;
  
  const messageDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Reset time to compare only dates
  const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  
  if (messageDateOnly.getTime() === todayOnly.getTime()) {
    return t ? t("messages.today") : 'Today';
  } else if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
    return t ? t("messages.yesterday") : 'Yesterday';
  } else {
    return messageDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
};

/**
 * Check if two dates are different (for date breakers)
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date
 * @returns {boolean} True if dates are different
 */
export const isDifferentDate = (date1, date2) => {
  if (!date1 || !date2) return true;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  
  return d1.getTime() !== d2.getTime();
};

