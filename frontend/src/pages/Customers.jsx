import { useEffect, useMemo, useState } from "react";

import {
  Search,
  Users,
  Mail,
  Phone,
  ShoppingBag,
  Ticket,
  X,
  Package,
  AlertCircle,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import {
  getCustomers,
  getCustomerOrders,
  getCustomerTickets,
} from "../services/api";

import "./Customers.css";


function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getCustomers();

        setCustomers(data);
      } catch (error) {
        console.error(
          "Failed to load customers:",
          error
        );

        setError(
          "Unable to load customers. Make sure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);


  const filteredCustomers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter(
      (customer) =>
        customer.name
          ?.toLowerCase()
          .includes(query) ||
        customer.email
          ?.toLowerCase()
          .includes(query) ||
        customer.customer_id
          ?.toLowerCase()
          .includes(query)
    );
  }, [customers, search]);


  return (
    <div className="customers-page">

      {/* Header */}

      <div className="customers-header">

        <div>
          <p className="eyebrow">
            Workspace
          </p>

          <h1>
            Customers
          </h1>

          <p className="page-description">
            Manage customer profiles and
            support activity.
          </p>
        </div>


        <div className="customer-count">
          <Users size={16} />

          <span>
            {customers.length} customers
          </span>
        </div>

      </div>


      {/* Search */}

      <div className="customers-toolbar">

        <div className="customer-search">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search by name, email, or customer ID..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>

      </div>


      {/* Error */}

      {error && (
        <div className="customers-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}


      {/* Loading */}

      {loading ? (

        <div className="customers-loading">

          <div className="loading-spinner" />

          <span>
            Loading customers...
          </span>

        </div>

      ) : filteredCustomers.length === 0 ? (

        <div className="customers-empty">

          <Users size={22} />

          <h3>
            No customers found
          </h3>

          <p>
            Try a different search term.
          </p>

        </div>

      ) : (

        <div className="customers-content">

          {/* Customer Table */}

          <div className="customers-table-card">

            <div className="customers-table-head">

              <span>
                Customer
              </span>

              <span>
                Contact
              </span>

              <span>
                Status
              </span>

              <span>
                Customer ID
              </span>

            </div>


            <div className="customers-table-body">

              {filteredCustomers.map(
                (customer) => (

                  <button
                    key={customer.customer_id}
                    className={`customer-row ${
                      selectedCustomer?.customer_id ===
                      customer.customer_id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedCustomer(
                        customer
                      )
                    }
                  >

                    {/* Customer */}

                    <div className="customer-main">

                      <div className="customer-avatar">

                        {getInitials(
                          customer.name
                        )}

                      </div>

                      <div>

                        <strong>
                          {customer.name}
                        </strong>

                        <span>
                          {customer.email}
                        </span>

                      </div>

                    </div>


                    {/* Contact */}

                    <div className="customer-contact">

                      <span>

                        <Mail size={14} />

                        {customer.email}

                      </span>

                      <span>

                        <Phone size={14} />

                        {customer.phone}

                      </span>

                    </div>


                    {/* Status */}

                    <div>

                      <span
                        className={`status-badge ${
                          customer.status ===
                          "active"
                            ? "active"
                            : "inactive"
                        }`}
                      >

                        {customer.status}

                      </span>

                    </div>


                    {/* ID */}

                    <div className="customer-id">

                      {customer.customer_id}

                    </div>

                  </button>
                )
              )}

            </div>

          </div>


          {/* Customer details */}

          {selectedCustomer && (

            <CustomerDetails
              customer={selectedCustomer}
              onClose={() =>
                setSelectedCustomer(null)
              }
            />

          )}

        </div>
      )}

    </div>
  );
}


/* ============================================================
   Customer Details
   ============================================================ */

function CustomerDetails({
  customer,
  onClose,
}) {
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [loadingOrders, setLoadingOrders] =
    useState(true);

  const [loadingTickets, setLoadingTickets] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadCustomerData = async () => {
      setLoadingOrders(true);
      setLoadingTickets(true);

      try {
        const [customerOrders, customerTickets] =
          await Promise.all([
            getCustomerOrders(
              customer.customer_id
            ),
            getCustomerTickets(
              customer.customer_id
            ),
          ]);

        if (!cancelled) {
          setOrders(customerOrders);
          setTickets(customerTickets);
        }

      } catch (error) {
        console.error(
          "Failed to load customer activity:",
          error
        );

        if (!cancelled) {
          setOrders([]);
          setTickets([]);
        }

      } finally {
        if (!cancelled) {
          setLoadingOrders(false);
          setLoadingTickets(false);
        }
      }
    };

    loadCustomerData();

    return () => {
      cancelled = true;
    };
  }, [customer.customer_id]);


  return (
    <aside className="customer-details">

      {/* Header */}

      <div className="details-header">

        <div>

          <p className="eyebrow">
            Customer profile
          </p>

          <h2>
            {customer.name}
          </h2>

        </div>


        <button
          className="close-details"
          onClick={onClose}
          aria-label="Close customer details"
        >
          <X size={17} />
        </button>

      </div>


      {/* Profile */}

      <div className="profile-card">

        <div className="large-avatar">
          {getInitials(customer.name)}
        </div>

        <div>

          <h3>
            {customer.name}
          </h3>

          <span>
            {customer.customer_id}
          </span>

        </div>

      </div>


      {/* Contact */}

      <div className="details-section">

        <p className="details-label">
          Contact information
        </p>


        <div className="detail-item">

          <Mail size={15} />

          <div>

            <span>
              Email
            </span>

            <strong>
              {customer.email}
            </strong>

          </div>

        </div>


        <div className="detail-item">

          <Phone size={15} />

          <div>

            <span>
              Phone
            </span>

            <strong>
              {customer.phone}
            </strong>

          </div>

        </div>

      </div>


      {/* Account */}

      <div className="details-section">

        <p className="details-label">
          Account
        </p>


        <div className="detail-row">

          <span>
            Status
          </span>

          <span
            className={`status-badge ${
              customer.status === "active"
                ? "active"
                : "inactive"
            }`}
          >
            {customer.status}
          </span>

        </div>


        <div className="detail-row">

          <span>
            Customer ID
          </span>

          <strong>
            {customer.customer_id}
          </strong>

        </div>


        <div className="detail-row">

          <span>
            Created
          </span>

          <strong>
            {formatDate(
              customer.created_at
            )}
          </strong>

        </div>

      </div>


      {/* Orders */}

      <div className="details-section">

        <div className="activity-section-heading">

          <div>
            <p className="details-label">
              Orders
            </p>

            <span className="activity-count">
              {loadingOrders
                ? "..."
                : `${orders.length}`}
            </span>
          </div>

          <ShoppingBag size={15} />

        </div>


        {loadingOrders ? (

          <ActivityLoader />

        ) : orders.length === 0 ? (

          <EmptyActivity
            icon={
              <Package size={16} />
            }
            text="No orders found"
          />

        ) : (

          <div className="activity-list">

            {orders.slice(0, 5).map(
              (order) => (

                <div
                  className="activity-item"
                  key={order.order_number}
                >

                  <div className="activity-icon">
                    <Package size={14} />
                  </div>


                  <div className="activity-main">

                    <strong>
                      {order.order_number}
                    </strong>

                    <span>
                      {order.product}
                    </span>

                  </div>


                  <div className="activity-side">

                    <span
                      className={`order-status ${
                        order.status
                      }`}
                    >
                      {order.status}
                    </span>

                    <strong>
                      ${order.amount}
                    </strong>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>


      {/* Tickets */}

      <div className="details-section">

        <div className="activity-section-heading">

          <div>

            <p className="details-label">
              Support tickets
            </p>

            <span className="activity-count">
              {loadingTickets
                ? "..."
                : `${tickets.length}`}
            </span>

          </div>

          <Ticket size={15} />

        </div>


        {loadingTickets ? (

          <ActivityLoader />

        ) : tickets.length === 0 ? (

          <EmptyActivity
            icon={
              <CheckCircle2 size={16} />
            }
            text="No support tickets"
          />

        ) : (

          <div className="activity-list">

            {tickets.slice(0, 5).map(
              (ticket) => (

                <div
                  className="activity-item"
                  key={ticket.ticket_id}
                >

                  <div className="activity-icon">
                    <Ticket size={14} />
                  </div>


                  <div className="activity-main">

                    <strong>
                      {ticket.ticket_id}
                    </strong>

                    <span>
                      {ticket.subject}
                    </span>

                  </div>


                  <div className="activity-side">

                    <span
                      className={`ticket-status ${
                        ticket.status
                      }`}
                    >
                      {ticket.status}
                    </span>

                    <span
                      className={`priority ${
                        ticket.priority
                      }`}
                    >
                      {ticket.priority}
                    </span>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </aside>
  );
}


/* ============================================================
   Loading / Empty
   ============================================================ */

function ActivityLoader() {
  return (
    <div className="activity-loader">
      <div className="small-spinner" />
      <span>
        Loading activity...
      </span>
    </div>
  );
}


function EmptyActivity({
  icon,
  text,
}) {
  return (
    <div className="activity-empty">
      {icon}
      <span>{text}</span>
    </div>
  );
}


/* ============================================================
   Helpers
   ============================================================ */

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toUpperCase()
    )
    .join("");
}


function formatDate(dateString) {
  if (!dateString) {
    return "—";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
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


export default Customers;