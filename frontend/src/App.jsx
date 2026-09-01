import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import Tickets from "./pages/Tickets";
import Analytics from "./pages/Analytics";
import CustomerPortal from "./pages/CustomerPortal";

import {
  createConversation,
  getConversations,
  getConversation,
  getCustomers,
  getAgentRuns,
  getCurrentUser,
  sendChatMessage,
} from "./services/api";

import {
  Bot,
  Send,
  Plus,
  MessageSquare,
  Ticket,
  Users,
  Package,
  BarChart3,
  Settings,
  ChevronRight,
  Circle,
  ShieldCheck,
  Database,
  Search,
  Clock3,
  UserRound,
  LogOut,
} from "lucide-react";

import "./App.css";


function App() {
  const [authLoading, setAuthLoading] =
    useState(true);

  const [user, setUser] =
    useState(null);


  /* ==========================================================
     AUTHENTICATION
     ========================================================== */

  useEffect(() => {
    const initializeAuth = async () => {
      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const currentUser =
          await getCurrentUser();

        setUser(currentUser);
      } catch (error) {
        console.error(
          "Authentication check failed:",
          error
        );

        localStorage.removeItem(
          "access_token"
        );

        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    initializeAuth();
  }, []);


  const handleLogin = async () => {
    try {
      const currentUser =
        await getCurrentUser();

      setUser(currentUser);
    } catch (error) {
      console.error(
        "Failed to load current user:",
        error
      );

      localStorage.removeItem(
        "access_token"
      );

      setUser(null);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem(
      "access_token"
    );

    setUser(null);
  };


  if (authLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-card">

          <div className="auth-loading-icon">
            <Bot size={22} />
          </div>

          <span>
            Loading SupportAI...
          </span>

          <div className="auth-loading-spinner" />

        </div>
      </div>
    );
  }


  if (!user) {
    return (
      <Login
        onLogin={handleLogin}
      />
    );
  }


  return (
    <AuthenticatedApp
      user={user}
      onLogout={handleLogout}
    />
  );
}


/* ============================================================
   AUTHENTICATED APPLICATION
   ============================================================ */

function AuthenticatedApp({
  user,
  onLogout,
}) {
  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [conversationId, setConversationId] =
    useState(null);

  const [conversationLoading, setConversationLoading] =
    useState(true);

  const [conversations, setConversations] =
    useState([]);

  const [historyLoading, setHistoryLoading] =
    useState(true);

  const [customers, setCustomers] =
    useState([]);

  const [selectedCustomerId, setSelectedCustomerId] =
    useState(null);

  const [activePage, setActivePage] =
    useState("chat");

  const [agentRuns, setAgentRuns] =
    useState([]);

  const [messages, setMessages] =
    useState([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi! I'm your AI support assistant. Tell me about your issue and I'll help you resolve it.",
        confidence: null,
        action: "welcome",
      },
    ]);


  /* ============================================================
     ROLE HELPERS
     ============================================================ */

  const isAdmin =
    user.role === "admin";

  const isSupportAgent =
    user.role === "support_agent";

  const isCustomer =
    user.role === "customer";


  const canViewCustomers =
    isAdmin ||
    isSupportAgent;

  const canViewOrders =
    isAdmin ||
    isSupportAgent;

  const canViewTickets =
    isAdmin ||
    isSupportAgent;

  const canViewAnalytics =
    isAdmin;


  /* ============================================================
     INITIALIZE DATA
     ============================================================ */

  useEffect(() => {
    const initializeApp =
      async () => {
        try {
          setHistoryLoading(true);
          setConversationLoading(true);

          const requests = [
            getConversations(),
            getAgentRuns(20),
          ];

          if (canViewCustomers) {
            requests.push(
              getCustomers()
            );
          }

          const results =
            await Promise.all(
              requests
            );

          const conversationHistory =
            results[0];

          const initialAgentRuns =
            results[1];

          const customerData =
            canViewCustomers
              ? results[2]
              : [];

          setConversations(
            conversationHistory
          );

          setAgentRuns(
            initialAgentRuns
          );

          setCustomers(
            customerData
          );


          /*
           * Customer users are always tied
           * to their own customer_id.
           */
          if (
            isCustomer &&
            user.customer_id
          ) {
            setSelectedCustomerId(
              user.customer_id
            );
          }


          if (
            conversationHistory.length >
            0
          ) {
            const latest =
              conversationHistory[0];

            setConversationId(
              latest._id
            );


            if (
              isCustomer &&
              user.customer_id
            ) {
              setSelectedCustomerId(
                user.customer_id
              );
            } else if (
              latest.customer_id
            ) {
              setSelectedCustomerId(
                latest.customer_id
              );
            }


            const conversation =
              await getConversation(
                latest._id
              );


            if (
              conversation.messages?.length >
              0
            ) {
              const restoredMessages =
                conversation.messages.map(
                  (
                    item,
                    index
                  ) => ({
                    id: `${conversation._id}-${index}`,
                    role: item.role,
                    content:
                      item.content,
                    confidence:
                      item.confidence ??
                      null,
                    action:
                      item.action ??
                      "history",
                  })
                );

              setMessages(
                restoredMessages
              );
            }

          } else {

            const conversation =
              await createConversation(
                isCustomer
                  ? user.customer_id
                  : null
              );

            setConversationId(
              conversation._id
            );

            setConversations([
              conversation,
            ]);
          }

        } catch (error) {
          console.error(
            "Failed to initialize application:",
            error
          );
        } finally {
          setHistoryLoading(false);
          setConversationLoading(false);
        }
      };

    initializeApp();
  }, [
    user.role,
    user.customer_id,
    canViewCustomers,
    isCustomer,
  ]);


  /* ============================================================
     AGENT RUNS
     ============================================================ */

  const refreshAgentRuns =
    async (query = null) => {
      try {
        const runs =
          await getAgentRuns(20);


        if (!query) {
          setAgentRuns(runs);
          return runs;
        }


        const matchingRuns =
          runs.filter((run) => {

            const sameQuery =
              run.user_query ===
              query;

            const effectiveCustomer =
              isCustomer
                ? user.customer_id
                : selectedCustomerId;

            const sameCustomer =
              !effectiveCustomer ||
              !run.customer_id ||
              run.customer_id ===
                effectiveCustomer;

            return (
              sameQuery &&
              sameCustomer
            );
          });


        if (
          matchingRuns.length > 0
        ) {
          setAgentRuns(
            matchingRuns
          );

          return matchingRuns;
        }


        setAgentRuns(runs);

        return runs;

      } catch (error) {
        console.error(
          "Failed to load agent runs:",
          error
        );

        return [];
      }
    };


  /* ============================================================
     SEND MESSAGE
     ============================================================ */

  const sendMessage = async () => {
    const trimmedMessage =
      message.trim();


    if (
      !trimmedMessage ||
      loading ||
      !conversationId
    ) {
      return;
    }


    const effectiveCustomerId =
      isCustomer
        ? user.customer_id
        : selectedCustomerId;


    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedMessage,
    };


    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);


    setMessage("");
    setLoading(true);
    setAgentRuns([]);


    try {

      const data =
        await sendChatMessage(
          conversationId,
          trimmedMessage,
          effectiveCustomerId
        );


      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.answer,
        confidence:
          data.confidence,
        action: data.action,
      };


      setMessages((prev) => [
        ...prev,
        assistantMessage,
      ]);


      setConversations((prev) =>
        prev.map(
          (conversation) => {

            if (
              conversation._id !==
              conversationId
            ) {
              return conversation;
            }


            return {
              ...conversation,

              customer_id:
                effectiveCustomerId ||
                conversation.customer_id,

              updated_at:
                new Date().toISOString(),

              messages: [
                ...(conversation.messages ||
                  []),
                assistantMessage,
              ],
            };
          }
        )
      );


      setTimeout(() => {
        refreshAgentRuns(
          trimmedMessage
        );
      }, 150);

    } catch (error) {

      console.error(
        "Chat request failed:",
        error
      );


      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "I'm having trouble connecting to the support system. Please make sure the backend is running.",
          action: "error",
          confidence: null,
        },
      ]);


      await refreshAgentRuns();

    } finally {
      setLoading(false);
    }
  };


  /* ============================================================
     SELECT CONVERSATION
     ============================================================ */

  const selectConversation =
    async (
      selectedConversationId
    ) => {

      if (
        loading ||
        selectedConversationId ===
          conversationId
      ) {
        return;
      }


      try {

        setConversationLoading(
          true
        );


        const conversation =
          await getConversation(
            selectedConversationId
          );


        setConversationId(
          conversation._id
        );


        if (isCustomer) {

          setSelectedCustomerId(
            user.customer_id ||
              null
          );

        } else {

          setSelectedCustomerId(
            conversation.customer_id ||
              null
          );

        }


        if (
          conversation.messages
            ?.length > 0
        ) {

          const restoredMessages =
            conversation.messages.map(
              (
                item,
                index
              ) => ({
                id: `${conversation._id}-${index}`,
                role: item.role,
                content:
                  item.content,
                confidence:
                  item.confidence ??
                  null,
                action:
                  item.action ??
                  "history",
              })
            );


          setMessages(
            restoredMessages
          );


          const latestUserMessage =
            [
              ...conversation.messages,
            ]
              .reverse()
              .find(
                (item) =>
                  item.role ===
                  "user"
              );


          if (
            latestUserMessage?.content
          ) {
            await refreshAgentRuns(
              latestUserMessage.content
            );
          }

        } else {

          setMessages([
            {
              id: `welcome-${Date.now()}`,
              role: "assistant",
              content:
                "This conversation is ready. How can I help?",
              confidence: null,
              action: "welcome",
            },
          ]);

          setAgentRuns([]);
        }

      } catch (error) {

        console.error(
          "Failed to load conversation:",
          error
        );

      } finally {

        setConversationLoading(
          false
        );

      }
    };


  /* ============================================================
     NEW CHAT
     ============================================================ */

  const newChat = async () => {

    try {

      setConversationLoading(
        true
      );


      const conversation =
        await createConversation(
          isCustomer
            ? user.customer_id
            : selectedCustomerId
        );


      setConversationId(
        conversation._id
      );


      setConversations((prev) => [
        conversation,
        ...prev,
      ]);


      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: "assistant",
          content:
            "New conversation started. How can I help you today?",
          confidence: null,
          action: "welcome",
        },
      ]);


      setAgentRuns([]);

      setActivePage("chat");

    } catch (error) {

      console.error(
        "Failed to create conversation:",
        error
      );

    } finally {

      setConversationLoading(
        false
      );

    }
  };


  /* ============================================================
     CUSTOMER SELECTION
     ============================================================ */

  const handleCustomerChange =
    (event) => {

      if (isCustomer) {
        return;
      }


      const customerId =
        event.target.value ||
        null;


      setSelectedCustomerId(
        customerId
      );

      setAgentRuns([]);
    };


  /* ============================================================
     KEYBOARD
     ============================================================ */

  const handleKeyDown = (
    event
  ) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();
    }
  };


  /* ============================================================
     CONVERSATION TITLE
     ============================================================ */

  const getConversationTitle =
    (conversation) => {

      if (
        conversation.title &&
        conversation.title !==
          "New conversation"
      ) {
        return conversation.title;
      }


      const firstUserMessage =
        conversation.messages?.find(
          (item) =>
            item.role === "user"
        );


      if (
        firstUserMessage?.content
      ) {
        return firstUserMessage.content;
      }


      return "New conversation";
    };


  /* ============================================================
     AGENT RUNS
     ============================================================ */

  const latestAgentRuns =
    getLatestAgentRuns(
      agentRuns
    );


  /* ============================================================
     SELECTED CUSTOMER
     ============================================================ */

  const selectedCustomer =
    customers.find(
      (customer) =>
        customer.customer_id ===
        selectedCustomerId
    );


  return (
    <div className="app-shell">

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            <Bot size={20} />
          </div>


          <div>

            <h1>
              SupportAI
            </h1>

            <span>
              Autonomous Support
            </span>

          </div>

        </div>


        <button
          className="new-chat-btn"
          onClick={newChat}
        >
          <Plus size={18} />

          New conversation

        </button>


        {/* Conversation History */}

        <div className="conversation-history">

          <p className="nav-label">
            Conversations
          </p>


          {historyLoading ? (

            <div className="history-state">
              Loading conversations...
            </div>

          ) : conversations.length ===
            0 ? (

            <div className="history-state">
              No conversations yet
            </div>

          ) : (

            <div className="conversation-list">

              {conversations
                .slice(0, 10)
                .map(
                  (conversation) => (

                    <button
                      key={
                        conversation._id
                      }
                      className={`conversation-item ${
                        conversation._id ===
                        conversationId
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        selectConversation(
                          conversation._id
                        )
                      }
                    >

                      <MessageSquare
                        size={14}
                      />

                      <span>
                        {getConversationTitle(
                          conversation
                        )}
                      </span>

                    </button>

                  )
                )}

            </div>

          )}

        </div>


        {/* =================================================
            ROLE-AWARE NAVIGATION
            ================================================= */}

        <nav className="sidebar-nav">

          <p className="nav-label">
            Workspace
          </p>


          {/* Everyone */}

          <button
            className={`nav-item ${
              activePage === "chat"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("chat")
            }
          >

            <MessageSquare size={18} />

            Support chat

          </button>


          {isCustomer ? (

            <button
              className={`nav-item ${
                activePage ===
                "portal"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActivePage(
                  "portal"
                )
              }
            >

              <UserRound size={18} />

              My account

            </button>

          ) : (

            <>

              {canViewOrders && (

                <button
                  className={`nav-item ${
                    activePage ===
                    "orders"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setActivePage(
                      "orders"
                    )
                  }
                >

                  <Package size={18} />

                  Orders

                </button>

              )}


              {canViewCustomers && (

                <button
                  className={`nav-item ${
                    activePage ===
                    "customers"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setActivePage(
                      "customers"
                    )
                  }
                >

                  <Users size={18} />

                  Customers

                </button>

              )}


              {canViewTickets && (

                <button
                  className={`nav-item ${
                    activePage ===
                    "tickets"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setActivePage(
                      "tickets"
                    )
                  }
                >

                  <Ticket size={18} />

                  Tickets

                </button>

              )}


              {canViewAnalytics && (

                <button
                  className={`nav-item ${
                    activePage ===
                    "analytics"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setActivePage(
                      "analytics"
                    )
                  }
                >

                  <BarChart3
                    size={18}
                  />

                  Analytics

                </button>

              )}

            </>

          )}


          <p className="nav-label second-label">
            System
          </p>


          <button className="nav-item">

            <Settings size={18} />

            Settings

          </button>

        </nav>


        {/* System status */}

        <div className="system-card">

          <div className="system-card-header">

            <div className="online-dot" />

            <span>
              System operational
            </span>

          </div>


          <p>
            AI support services are
            online and ready to process
            customer requests.
          </p>

        </div>


        {/* User profile */}

        <div className="profile">

          <div className="avatar">

            {getInitials(
              user.username
            )}

          </div>


          <div className="profile-info">

            <strong>
              {user.username}
            </strong>

            <span>
              {formatRole(
                user.role
              )}
            </span>

          </div>


          <button
            className="logout-button"
            onClick={onLogout}
            title="Sign out"
            aria-label="Sign out"
          >

            <LogOut size={15} />

          </button>

        </div>

      </aside>


      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="main-content">

        {/* Customer Portal */}

        {activePage === "portal" &&
        isCustomer ? (

          <CustomerPortal
            user={user}
            onOpenChat={() =>
              setActivePage("chat")
            }
          />

        ) : activePage ===
          "customers" &&
          canViewCustomers ? (

          <Customers />

        ) : activePage ===
          "orders" &&
          canViewOrders ? (

          <Orders />

        ) : activePage ===
          "tickets" &&
          canViewTickets ? (

          <Tickets />

        ) : activePage ===
          "analytics" &&
          canViewAnalytics ? (

          <Analytics />

        ) : (

          <>
            {/* =================================================
                TOPBAR
                ================================================= */}

            <header className="topbar">

              <div>

                <div className="breadcrumb">

                  Workspace

                  <ChevronRight size={14} />

                  Support Chat

                </div>


                <h2>
                  Customer Support
                </h2>

              </div>


              <div className="topbar-right">

                <div className="live-status">

                  <Circle
                    size={9}
                    fill="currentColor"
                  />

                  Live

                </div>


                <div className="topbar-icon">

                  <ShieldCheck
                    size={18}
                  />

                </div>


                <div className="topbar-icon">

                  <Settings
                    size={18}
                  />

                </div>

              </div>

            </header>


            {/* =================================================
                CHAT WORKSPACE
                ================================================= */}

            <div className="workspace">

              <section className="chat-panel">

                <div className="chat-header">

                  <div className="chat-title">

                    <div className="bot-avatar">

                      <Bot size={21} />

                    </div>


                    <div>

                      <h3>
                        AI Support Assistant
                      </h3>

                      <span>
                        Powered by LangGraph
                        + RAG + MongoDB
                      </span>

                    </div>

                  </div>


                  <div className="chat-header-right">

                    {canViewCustomers ? (

                      <div className="customer-selector">

                        <UserRound
                          size={14}
                        />

                        <select
                          value={
                            selectedCustomerId ||
                            ""
                          }
                          onChange={
                            handleCustomerChange
                          }
                        >

                          <option value="">
                            Guest customer
                          </option>


                          {customers.map(
                            (
                              customer
                            ) => (

                              <option
                                key={
                                  customer.customer_id
                                }
                                value={
                                  customer.customer_id
                                }
                              >
                                {customer.name}
                              </option>

                            )
                          )}

                        </select>

                      </div>

                    ) : (

                      <div className="customer-selector customer-locked">

                        <UserRound
                          size={14}
                        />

                        <span>
                          {user.customer_id ||
                            "Customer"}
                        </span>

                      </div>

                    )}


                    <div className="secure-badge">

                      <ShieldCheck
                        size={15}
                      />

                      Secure

                    </div>

                  </div>

                </div>


                {/* Messages */}

                <div className="messages-container">

                  {messages.map(
                    (item) => (

                      <div
                        key={item.id}
                        className={`message-row ${item.role}`}
                      >

                        {item.role ===
                          "assistant" && (

                          <div className="message-avatar">

                            <Bot size={16} />

                          </div>

                        )}


                        <div
                          className={`message-bubble ${
                            item.role ===
                            "user"
                              ? "user-bubble"
                              : "ai-bubble"
                          }`}
                        >

                          <div className="message-content">

                            {item.content}

                          </div>


                          {item.role ===
                            "assistant" &&
                            item.confidence !==
                              null && (

                            <div className="message-meta">

                              <span
                                className={`action-badge ${item.action}`}
                              >

                                {item.action ===
                                  "answer"
                                  ? "Resolved"
                                  : item.action ===
                                      "clarify"
                                    ? "Clarification"
                                    : item.action ===
                                        "escalate"
                                      ? "Escalated"
                                      : item.action}

                              </span>


                              <span className="confidence">

                                Confidence{" "}

                                {Math.round(
                                  item.confidence *
                                    100
                                )}

                                %

                              </span>

                            </div>

                          )}

                        </div>

                      </div>

                  ))}


                  {loading && (

                    <div className="message-row assistant">

                      <div className="message-avatar">

                        <Bot size={16} />

                      </div>


                      <div className="message-bubble ai-bubble typing">

                        <span />
                        <span />
                        <span />

                      </div>

                    </div>

                  )}

                </div>


                {/* Composer */}

                <div className="composer-area">

                  <div className="composer">

                    <textarea
                      value={message}
                      onChange={(
                        event
                      ) =>
                        setMessage(
                          event.target.value
                        )
                      }
                      onKeyDown={
                        handleKeyDown
                      }
                      placeholder={
                        conversationLoading
                          ? "Starting conversation..."
                          : selectedCustomer
                            ? `Ask about ${selectedCustomer.name}...`
                            : isCustomer
                              ? "Describe your issue..."
                              : "Describe your issue..."
                      }
                      rows={1}
                    />


                    <button
                      className="send-btn"
                      onClick={
                        sendMessage
                      }
                      disabled={
                        !message.trim() ||
                        loading ||
                        conversationLoading ||
                        !conversationId
                      }
                      aria-label="Send message"
                    >

                      <Send size={18} />

                    </button>

                  </div>


                  <div className="composer-footer">

                    <span>

                      Press{" "}

                      <strong>
                        Enter
                      </strong>{" "}

                      to send

                    </span>


                    <span>

                      AI can make mistakes.
                      Verify important
                      information.

                    </span>

                  </div>

                </div>

              </section>


              {/* =================================================
                  RIGHT PANEL
                  ================================================= */}

              <aside className="info-panel">

                <div className="panel-section">

                  <div className="panel-heading">

                    <div>

                      <p className="eyebrow">
                        AI orchestration
                      </p>

                      <h3>
                        Agent activity
                      </h3>

                    </div>


                    <span className="active-pill">
                      Live
                    </span>

                  </div>


                  <div className="agent-list">

                    <AgentRunRow
                      agentName="Intent Agent"
                      run={findAgentRun(
                        latestAgentRuns,
                        "Intent Agent"
                      )}
                      icon={
                        <Search
                          size={16}
                        />
                      }
                      loading={loading}
                    />


                    <AgentRunRow
                      agentName="MongoDB Agent"
                      run={findAgentRun(
                        latestAgentRuns,
                        "MongoDB Agent"
                      )}
                      icon={
                        <Database
                          size={16}
                        />
                      }
                      loading={loading}
                    />


                    <AgentRunRow
                      agentName="RAG Agent"
                      run={findAgentRun(
                        latestAgentRuns,
                        "RAG Agent"
                      )}
                      icon={
                        <Database
                          size={16}
                        />
                      }
                      loading={loading}
                    />


                    <AgentRunRow
                      agentName="Confidence Agent"
                      run={findAgentRun(
                        latestAgentRuns,
                        "Confidence Agent"
                      )}
                      icon={
                        <ShieldCheck
                          size={16}
                        />
                      }
                      loading={loading}
                    />


                    <AgentRunRow
                      agentName="Escalation Agent"
                      run={findAgentRun(
                        latestAgentRuns,
                        "Escalation Agent"
                      )}
                      icon={
                        <Ticket
                          size={16}
                        />
                      }
                      loading={loading}
                    />

                  </div>

                </div>


                <div className="divider" />


                {/* Customer context */}

                <div className="panel-section">

                  <div className="panel-heading">

                    <div>

                      <p className="eyebrow">
                        Customer context
                      </p>

                      <h3>
                        Current session
                      </h3>

                    </div>

                  </div>


                  <div className="context-card">

                    <div className="context-row">

                      <span>
                        Customer
                      </span>

                      <strong>

                        {isCustomer
                          ? user.username
                          : selectedCustomer
                            ? selectedCustomer.name
                            : "Guest customer"}

                      </strong>

                    </div>


                    <div className="context-row">

                      <span>
                        Customer ID
                      </span>

                      <strong>

                        {isCustomer
                          ? user.customer_id ||
                            "—"
                          : selectedCustomerId ||
                            "—"}

                      </strong>

                    </div>


                    <div className="context-row">

                      <span>
                        Role
                      </span>

                      <strong>

                        {formatRole(
                          user.role
                        )}

                      </strong>

                    </div>


                    <div className="context-row">

                      <span>
                        Session
                      </span>

                      <strong>
                        Active
                      </strong>

                    </div>

                  </div>

                </div>


                <div className="divider" />


                {/* Metrics */}

                <div className="panel-section">

                  <div className="panel-heading">

                    <div>

                      <p className="eyebrow">
                        System metrics
                      </p>

                      <h3>
                        Current
                      </h3>

                    </div>

                  </div>


                  <div className="mini-metrics">

                    <Metric
                      icon={
                        <MessageSquare
                          size={16}
                        />
                      }
                      label="Conversations"
                      value={
                        conversations.length
                      }
                    />


                    {canViewCustomers && (

                      <Metric
                        icon={
                          <Users
                            size={16}
                          />
                        }
                        label="Customers"
                        value={
                          customers.length
                        }
                      />

                    )}


                    <Metric
                      icon={
                        <Clock3
                          size={16}
                        />
                      }
                      label="Agent runs"
                      value={
                        agentRuns.length
                      }
                    />

                  </div>

                </div>

              </aside>

            </div>

          </>

        )}

      </main>

    </div>
  );
}


/* ============================================================
   Agent Run Row
   ============================================================ */

function AgentRunRow({
  agentName,
  run,
  icon,
  loading,
}) {
  const status =
    loading
      ? "running"
      : run?.status || "waiting";


  let indicatorClass =
    "waiting";


  if (
    status === "completed"
  ) {
    indicatorClass =
      "completed";
  }


  if (
    status === "failed"
  ) {
    indicatorClass =
      "failed";
  }


  if (
    status === "running"
  ) {
    indicatorClass =
      "processing";
  }


  return (
    <div className="agent-row">

      <div className="agent-icon">
        {icon}
      </div>


      <div className="agent-info">

        <strong>
          {agentName}
        </strong>


        <span>

          {loading
            ? "Processing"
            : run
              ? getAgentDescription(
                  run
                )
              : "No recent run"}

        </span>

      </div>


      <div
        className={`agent-indicator ${indicatorClass}`}
      >

        {loading ||
        run?.status ===
          "running" ? (

          <div className="spinner" />

        ) : (

          <Circle
            size={8}
            fill="currentColor"
          />

        )}

      </div>

    </div>
  );
}


/* ============================================================
   Agent helpers
   ============================================================ */

function getLatestAgentRuns(
  runs = []
) {
  const latest = {};

  for (const run of runs) {

    if (!run.agent) {
      continue;
    }

    if (!latest[run.agent]) {
      latest[run.agent] =
        run;
    }
  }

  return latest;
}


function findAgentRun(
  runs,
  agentName
) {
  return (
    runs?.[agentName] ||
    null
  );
}


function getAgentDescription(
  run
) {
  if (
    run.status ===
    "failed"
  ) {
    return "Failed";
  }


  if (
    run.agent ===
    "Intent Agent"
  ) {

    return run.intent
      ? `${run.intent} · ${formatDuration(
          run.duration_ms
        )}`
      : `Completed · ${formatDuration(
          run.duration_ms
        )}`;

  }


  if (
    run.agent ===
    "Confidence Agent"
  ) {

    if (
      run.answer_confidence !==
        null &&
      run.answer_confidence !==
        undefined
    ) {

      return `${Math.round(
        run.answer_confidence *
          100
      )}% confidence · ${formatDuration(
        run.duration_ms
      )}`;

    }

    return `Completed · ${formatDuration(
      run.duration_ms
    )}`;

  }


  if (
    run.agent ===
    "Escalation Agent"
  ) {

    return run.action ===
      "escalate"
      ? `Escalated · ${formatDuration(
          run.duration_ms
        )}`
      : `Completed · ${formatDuration(
          run.duration_ms
        )}`;

  }


  return `Completed · ${formatDuration(
    run.duration_ms
  )}`;
}


function formatDuration(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  return `${Number(value).toFixed(
    2
  )} ms`;
}


/* ============================================================
   User helpers
   ============================================================ */

function getInitials(
  name = ""
) {
  return name
    .split(" ")
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toUpperCase()
    )
    .join("");
}


function formatRole(
  role = ""
) {
  return role
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}


/* ============================================================
   Metric
   ============================================================ */

function Metric({
  icon,
  label,
  value,
}) {
  return (
    <div className="metric">

      <div className="metric-icon">
        {icon}
      </div>

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}


export default App;