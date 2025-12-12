import client from "../api/axiosInstance";
import { CHAT_ENDPOINTS } from "../constants/apiEndpoints";
import Config from "../config/index";
import * as signalR from "@microsoft/signalr";
import { SERVICE_HEADERS, normalizeResponse } from "../utils/serviceUtils";

export const createSignalRConnection = (userId) => {
  const url = `${Config.API_URL}${CHAT_ENDPOINTS.SIGNALR_HUB_URL}?userId=${encodeURIComponent(userId)}`;
  const conn = new signalR.HubConnectionBuilder()
    .withUrl(url)
    .withAutomaticReconnect()
    .build();

  return conn;
};


// Send message API
export const sendMessage = async (messageData) => {
  const response = await client.post(
    CHAT_ENDPOINTS.SEND_MESSAGE,
    { 
      senderId: messageData.senderId,
      receiverId: messageData.receiverId,
      message: messageData.message,
      chatId: messageData.chatId || null,
      replyToMessageId: messageData.replyToMessageId || null,
    },
    {
      headers: SERVICE_HEADERS.JSON,
    }
  );

  return normalizeResponse(response, "Message sent successfully");
};

// Get messages API
export const getMessages = async (chatId, userId, page = 1, pageSize = 15) => {
  const response = await client.post(
    CHAT_ENDPOINTS.GET_MESSAGES,
    {
      chatId: chatId,
      userId: userId,
      page: page,
      pageSize: pageSize,
    },
    {
      headers: SERVICE_HEADERS.JSON,
    }
  );

  return normalizeResponse(response, "Messages fetched successfully");
};

// Get chat list API
export const getChatList = async (userId) => {
  const response = await client.get(CHAT_ENDPOINTS.GET_CHAT_LIST(userId), {
    headers: SERVICE_HEADERS.TEXT_PLAIN,
  });

  return normalizeResponse(response, "Chat list fetched successfully");
};

// Mark messages as read API
export const markAsRead = async (chatId, userId) => {
  const response = await client.post(
    CHAT_ENDPOINTS.MARK_AS_READ(chatId, userId),
    {},
    {
      headers: SERVICE_HEADERS.JSON_WILDCARD,
    }
  );

  return normalizeResponse(response, "Messages marked as read");
};

// Get chat user list (search users) API
export const getChatUserList = async (userId, searchText) => {
  const response = await client.get(
    CHAT_ENDPOINTS.GET_CHAT_USER_LIST(userId, searchText),
    {
      headers: SERVICE_HEADERS.TEXT_PLAIN,
    }
  );

  return normalizeResponse(response, "Users fetched successfully");
};

