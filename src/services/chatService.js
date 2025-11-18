import client from "../api/axiosInstance";
import { CHAT_ENDPOINTS } from "../constants/apiEndpoints";
import * as signalR from "@microsoft/signalr";

let connection = null;

// Initialize SignalR connection
export const initializeSignalRConnection = (token) => {
  if (connection) {
    return connection;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(CHAT_ENDPOINTS.SIGNALR_HUB_URL, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .build();

  return connection;
};

// Start SignalR connection
export const startSignalRConnection = async (connection) => {
  try {
    if (connection.state === signalR.HubConnectionState.Disconnected) {
      await connection.start();
      console.log("SignalR Connected");
    }
  } catch (error) {
    console.error("Error starting SignalR connection:", error);
    throw error;
  }
};

// Stop SignalR connection
export const stopSignalRConnection = async () => {
  if (connection) {
    try {
      await connection.stop();
      connection = null;
      console.log("SignalR Disconnected");
    } catch (error) {
      console.error("Error stopping SignalR connection:", error);
    }
  }
};

// Get SignalR connection instance
export const getSignalRConnection = () => {
  return connection;
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

