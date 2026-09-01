import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Package,
  X,
  UserRound,
  CalendarDays,
  DollarSign,
  Hash,
} from "lucide-react";

import { getOrders } from "../services/api";
import "./Orders.css";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getOrders();
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders:", err);
        setError(
          "Unable to load orders. Make sure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.order_number?.toLowerCase().includes(query) ||
        order.customer_id?.toLowerCase().includes(query) ||
        order.product?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Orders</h1>
          <p className="page-description">
            Monitor customer orders and fulfillment status.
          </p>
        </div>

        <div className="orders-count">
          <Package size={16} />
          <span>{orders.length} orders</span>
        </div>
      </div>

      <div className="orders-toolbar">
        <div className="order-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search order number, customer ID, or product..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="status-filters">
          {[
            "all",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
            "returned",
          ].map((status) => (
            <button
              key={status}
              className={`filter-btn ${
                statusFilter === status ? "active" : ""
              }`}
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? "All" : status}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="orders-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="orders-loading">
          <div className="order-spinner" />
          <span>Loading orders...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="orders-empty">
          <Package size={22} />
          <h3>No orders found</h3>
          <p>Try another search or status filter.</p>
        </div>
      ) : (
        <div className="orders-content">
          <div className="orders-table-card">
            <div className="orders-table-head">
              <span>Order</span>
              <span>Customer</span>
              <span>Product</span>
              <span>Amount</span>
              <span>Status</span>
            </div>

            <div className="orders-table-body">
              {filteredOrders.map((order) => (
                <button
                  key={order.order_number}
                  className={`order-row ${
                    selectedOrder?.order_number ===
                    order.order_number
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="order-number">
                    <div className="order-icon">
                      <Package size={15} />
                    </div>

                    <div>
                      <strong>{order.order_number}</strong>
                      <span>
                        {formatDate(order.ordered_at)}
                      </span>
                    </div>
                  </div>

                  <div className="order-customer">
                    {order.customer_id}
                  </div>

                  <div className="order-product">
                    {order.product}
                  </div>

                  <div className="order-amount">
                    ${Number(order.amount).toFixed(2)}
                  </div>

                  <div>
                    <span
                      className={`order-status ${order.status}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedOrder && (
            <OrderDetails
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function OrderDetails({ order, onClose }) {
  return (
    <aside className="order-details">
      <div className="order-details-header">
        <div>
          <p className="eyebrow">Order details</p>
          <h2>{order.order_number}</h2>
        </div>

        <button
          className="close-order"
          onClick={onClose}
          aria-label="Close order details"
        >
          <X size={17} />
        </button>
      </div>

      <div className="order-product-card">
        <div className="large-order-icon">
          <Package size={20} />
        </div>

        <div>
          <h3>{order.product}</h3>
          <span>{order.order_number}</span>
        </div>
      </div>

      <div className="order-detail-section">
        <p className="details-label">Order information</p>

        <DetailRow
          icon={<Hash size={14} />}
          label="Order number"
          value={order.order_number}
        />

        <DetailRow
          icon={<UserRound size={14} />}
          label="Customer"
          value={order.customer_id}
        />

        <DetailRow
          icon={<Package size={14} />}
          label="Quantity"
          value={order.quantity}
        />

        <DetailRow
          icon={<DollarSign size={14} />}
          label="Amount"
          value={`$${Number(order.amount).toFixed(2)}`}
        />
      </div>

      <div className="order-detail-section">
        <p className="details-label">Fulfillment</p>

        <div className="detail-row-line">
          <span>Status</span>
          <span className={`order-status ${order.status}`}>
            {order.status}
          </span>
        </div>

        <DetailRow
          icon={<CalendarDays size={14} />}
          label="Ordered"
          value={formatDate(order.ordered_at)}
        />

        <DetailRow
          icon={<CalendarDays size={14} />}
          label="Delivery date"
          value={formatDate(order.delivery_date)}
        />
      </div>

      <div className="order-detail-section">
        <p className="details-label">Customer reference</p>

        <div className="customer-reference">
          <UserRound size={16} />

          <div>
            <span>Customer ID</span>
            <strong>{order.customer_id}</strong>
          </div>
        </div>
      </div>
    </aside>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="order-detail-row">
      <div className="order-detail-label">
        {icon}
        <span>{label}</span>
      </div>

      <strong>{value}</strong>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default Orders;