import { useEffect, useState } from "react";

import {
  UserRound,
  Package,
  Ticket,
  Mail,
  CalendarDays,
  Circle,
  AlertCircle,
  RefreshCw,
  MessageSquare,
} from "lucide-react";

import {
  getCustomer,
  getCustomerOrders,
  getCustomerTickets,
} from "../services/api";

import "./CustomerPortal.css";


function CustomerPortal({
  user,
  onOpenChat,
}) {
  const [customer, setCustomer] =
    useState(null);

  const [orders, setOrders] =
    useState([]);

  const [tickets, setTickets] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    const loadPortal = async () => {
      if (!user?.customer_id) {
        setError(
          "Your account is not linked to a customer profile."
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          customerData,
          orderData,
          ticketData,
        ] = await Promise.all([
          getCustomer(
            user.customer_id
          ),
          getCustomerOrders(
            user.customer_id
          ),
          getCustomerTickets(
            user.customer_id
          ),
        ]);

        setCustomer(
          customerData
        );

        setOrders(
          orderData
        );

        setTickets(
          ticketData
        );

      } catch (err) {
        console.error(
          "Failed to load customer portal:",
          err
        );

        setError(
          err?.response?.data?.detail ||
            "Unable to load your customer information."
        );

      } finally {
        setLoading(false);
      }
    };

    loadPortal();
  }, [user?.customer_id]);


  if (loading) {
    return (
      <div className="customer-portal">

        <div className="portal-loading">

          <div className="portal-spinner" />

          <span>
            Loading your account...
          </span>

        </div>

      </div>
    );
  }


  if (error) {
    return (
      <div className="customer-portal">

        <div className="portal-error">

          <AlertCircle size={18} />

          <div>

            <strong>
              Unable to load account
            </strong>

            <span>
              {error}
            </span>

          </div>

        </div>

      </div>
    );
  }


  return (
    <div className="customer-portal">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="portal-header">

        <div>

          <p className="eyebrow">
            Customer portal
          </p>

          <h1>
            Welcome back,{" "}
            {customer?.name ||
              user.username}
          </h1>

          <p className="portal-description">
            View your account, orders,
            support tickets, and get help
            from the AI support assistant.
          </p>

        </div>


        <button
          className="portal-chat-button"
          onClick={onOpenChat}
        >

          <MessageSquare size={16} />

          Contact support

        </button>

      </header>


      {/* =====================================================
          SUMMARY CARDS
          ===================================================== */}

      <div className="portal-summary">

        <SummaryCard
          icon={
            <UserRound size={18} />
          }
          label="Customer ID"
          value={
            customer?.customer_id ||
            user.customer_id
          }
        />


        <SummaryCard
          icon={
            <Package size={18} />
          }
          label="Orders"
          value={orders.length}
        />


        <SummaryCard
          icon={
            <Ticket size={18} />
          }
          label="Support tickets"
          value={tickets.length}
        />


        <SummaryCard
          icon={
            <Circle
              size={18}
              fill="currentColor"
            />
          }
          label="Account"
          value={
            customer?.status ||
            "active"
          }
        />

      </div>


      {/* =====================================================
          MAIN GRID
          ===================================================== */}

      <div className="portal-grid">

        {/* Profile */}

        <section className="portal-card">

          <div className="portal-card-header">

            <div>

              <p className="eyebrow">
                Account
              </p>

              <h2>
                My profile
              </h2>

            </div>


            <div className="portal-card-icon">

              <UserRound size={16} />

            </div>

          </div>


          <div className="profile-details">

            <DetailRow
              icon={
                <UserRound size={15} />
              }
              label="Name"
              value={
                customer?.name ||
                user.username
              }
            />


            <DetailRow
              icon={
                <Mail size={15} />
              }
              label="Email"
              value={
                customer?.email ||
                user.email
              }
            />


            <DetailRow
              icon={
                <UserRound size={15} />
              }
              label="Customer ID"
              value={
                customer?.customer_id ||
                user.customer_id
              }
            />


            <DetailRow
              icon={
                <CalendarDays
                  size={15}
                />
              }
              label="Joined"
              value={formatDate(
                customer?.created_at
              )}
            />

          </div>

        </section>


        {/* Recent tickets */}

        <section className="portal-card">

          <div className="portal-card-header">

            <div>

              <p className="eyebrow">
                Support
              </p>

              <h2>
                My tickets
              </h2>

            </div>


            <div className="portal-card-icon">

              <Ticket size={16} />

            </div>

          </div>


          {tickets.length === 0 ? (

            <EmptyState
              icon={
                <Ticket size={18} />
              }
              text="You don't have any support tickets."
            />

          ) : (

            <div className="portal-list">

              {tickets
                .slice(0, 5)
                .map((ticket) => (

                  <div
                    className="portal-list-row"
                    key={
                      ticket.ticket_id
                    }
                  >

                    <div className="portal-list-main">

                      <strong>
                        {ticket.ticket_id}
                      </strong>

                      <span>
                        {ticket.subject ||
                          "Support request"}
                      </span>

                    </div>


                    <span
                      className={`portal-status ${
                        ticket.status
                      }`}
                    >
                      {formatStatus(
                        ticket.status
                      )}
                    </span>

                  </div>

                ))}

            </div>

          )}

        </section>


        {/* Orders */}

        <section className="portal-card portal-orders-card">

          <div className="portal-card-header">

            <div>

              <p className="eyebrow">
                Commerce
              </p>

              <h2>
                My orders
              </h2>

            </div>


            <div className="portal-card-icon">

              <Package size={16} />

            </div>

          </div>


          {orders.length === 0 ? (

            <EmptyState
              icon={
                <Package size={18} />
              }
              text="You don't have any orders."
            />

          ) : (

            <div className="orders-table">

              <div className="orders-table-head">

                <span>
                  Order
                </span>

                <span>
                  Product
                </span>

                <span>
                  Amount
                </span>

                <span>
                  Status
                </span>

              </div>


              {orders
                .slice(0, 8)
                .map((order) => (

                  <div
                    className="orders-table-row"
                    key={
                      order.order_number
                    }
                  >

                    <strong>
                      {order.order_number}
                    </strong>

                    <span>
                      {order.product ||
                        "—"}
                    </span>

                    <span>
                      {formatAmount(
                        order.amount
                      )}
                    </span>

                    <span
                      className={`portal-status ${
                        order.status
                      }`}
                    >
                      {formatStatus(
                        order.status
                      )}
                    </span>

                  </div>

                ))}

            </div>

          )}

        </section>

      </div>

    </div>
  );
}


/* ============================================================
   Summary Card
   ============================================================ */

function SummaryCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="portal-summary-card">

      <div className="summary-icon">
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


/* ============================================================
   Detail Row
   ============================================================ */

function DetailRow({
  icon,
  label,
  value,
}) {
  return (
    <div className="detail-row">

      <div className="detail-label">

        {icon}

        <span>
          {label}
        </span>

      </div>


      <strong>
        {value || "—"}
      </strong>

    </div>
  );
}


/* ============================================================
   Empty State
   ============================================================ */

function EmptyState({
  icon,
  text,
}) {
  return (
    <div className="portal-empty">

      <div className="portal-empty-icon">
        {icon}
      </div>

      <span>
        {text}
      </span>

    </div>
  );
}


/* ============================================================
   Helpers
   ============================================================ */

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}


function formatAmount(amount) {
  if (
    amount === null ||
    amount === undefined
  ) {
    return "—";
  }

  return `$${Number(amount).toFixed(
    2
  )}`;
}


function formatDate(dateString) {
  if (!dateString) {
    return "—";
  }

  const date = new Date(
    dateString
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


export default CustomerPortal;