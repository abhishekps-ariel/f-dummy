import client from "../api/axiosInstance";
import { CHAT_ENDPOINTS } from "../constants/apiEndpoints";
import Config from "../config/index";
import * as signalR from "@microsoft/signalr";

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
      headers: {
        Accept: "text/plain",
        "Content-Type": "application/json",
      },
    }
  );

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
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
      headers: {
        Accept: "text/plain",
        "Content-Type": "application/json",
      },
    }
  );

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

// Get chat list API
export const getChatList = async (userId) => {
  const response = await client.get(CHAT_ENDPOINTS.GET_CHAT_LIST(userId), {
    headers: {
      Accept: "text/plain",
    },
  });

  return {
    isSuccess: response.data.success,
    msg: response.data.message,
    data: response.data.data,
  };
};

// Mark messages as read API
export const markAsRead = async (chatId, userId) => {
  const response = await client.post(
    CHAT_ENDPOINTS.MARK_AS_READ(chatId, userId),
    {},
    {
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    }
  );

  return {
    isSuccess: response.data?.success !== false,
    msg: response.data?.message || "Messages marked as read",
    data: response.data?.data,
  };
};

