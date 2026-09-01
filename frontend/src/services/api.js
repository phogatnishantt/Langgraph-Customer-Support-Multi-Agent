import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});


/*
 * Automatically attach JWT to authenticated requests.
 */
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


/*
 * Automatically remove an invalid token.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(
        "access_token"
      );
    }

    return Promise.reject(error);
  }
);


/* ============================================================
   Authentication
   ============================================================ */

export const login = async (
  email,
  password
) => {
  const response = await api.post(
    "/auth/login",
    {
      email,
      password,
    }
  );

  return response.data;
};


export const getCurrentUser = async () => {
  const response = await api.get(
    "/auth/me"
  );

  return response.data;
};


/* ============================================================
   Conversations
   ============================================================ */

export const createConversation = async (
  customerId = null
) => {
  const response = await api.post(
    "/conversations/",
    {
      customer_id: customerId,
      title: "New conversation",
    }
  );

  return response.data;
};


export const getConversations = async () => {
  const response = await api.get(
    "/conversations/"
  );

  return response.data;
};


export const getConversation = async (
  conversationId
) => {
  const response = await api.get(
    `/conversations/${conversationId}`
  );

  return response.data;
};


/* ============================================================
   Chat
   ============================================================ */

export const sendChatMessage = async (
  conversationId,
  message,
  customerId = null
) => {
  const response = await api.post(
    "/chat/",
    {
      conversation_id:
        conversationId,
      message,
      customer_id:
        customerId,
    }
  );

  return response.data;
};


/* ============================================================
   Customers
   ============================================================ */

export const getCustomers = async () => {
  const response = await api.get(
    "/customers/"
  );

  return response.data;
};


export const getCustomerOrders = async (
  customerId
) => {
  const response = await api.get(
    `/orders/customer/${customerId}`
  );

  return response.data;
};


export const getCustomerTickets = async (
  customerId
) => {
  const response = await api.get(
    `/tickets/customer/${customerId}`
  );

  return response.data;
};


/* ============================================================
   Orders
   ============================================================ */

export const getOrders = async () => {
  const response = await api.get(
    "/orders/"
  );

  return response.data;
};


/* ============================================================
   Tickets
   ============================================================ */

export const getTickets = async () => {
  const response = await api.get(
    "/tickets/"
  );

  return response.data;
};


/* ============================================================
   Analytics
   ============================================================ */

export const getAnalytics = async () => {
  const response = await api.get(
    "/analytics/"
  );

  return response.data;
};


export const getAgentRuns = async (
  limit = 20
) => {
  const response = await api.get(
    `/analytics/agent-runs?limit=${limit}`
  );

  return response.data;
};

export const getCustomer = async (
  customerId
) => {
  const response = await api.get(
    `/customers/${customerId}`
  );

  return response.data;
};

export const updateTicketStatus = async (
  ticketId,
  status
) => {
  const response = await api.patch(
    `/tickets/${ticketId}`,
    {
      status,
    }
  );

  return response.data;
};


export default api;