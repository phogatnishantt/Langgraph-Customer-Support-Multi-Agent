import { useEffect, useMemo, useState } from "react";

import {
  Users,
  ShoppingBag,
  Ticket,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  UserX,
  Package,
} from "lucide-react";

import { getAnalytics } from "../services/api";

import "./Analytics.css";


function Analytics() {
  const [analytics, setAnalytics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getAnalytics();

        setAnalytics(data);

      } catch (err) {
        console.error(
          "Failed to load analytics:",
          err
        );

        setError(
          "Unable to load analytics. Make sure the backend is running."
        );

      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);


  const orderTotal =
    analytics?.totals?.orders || 0;


  const ticketTotal =
    analytics?.totals?.tickets || 0;


  const ordersByStatus =
    analytics?.orders?.by_status || {};


  const ticketsByStatus =
    analytics?.tickets?.by_status || {};


  const ticketsByPriority =
    analytics?.tickets?.by_priority || {};


  const maxOrderStatus =
    Math.max(
      ...Object.values(
        ordersByStatus
      ),
      1
    );


  const maxTicketStatus =
    Math.max(
      ...Object.values(
        ticketsByStatus
      ),
      1
    );


  const maxPriority =
    Math.max(
      ...Object.values(
        ticketsByPriority
      ),
      1
    );


  const ticketResolutionRate =
    analytics?.tickets
      ?.resolution_rate || 0;


  const ticketEscalationRate =
    analytics?.tickets
      ?.escalation_rate || 0;


  const orderStatusData =
    useMemo(
      () => [
        ["processing", ordersByStatus.processing || 0],
        ["shipped", ordersByStatus.shipped || 0],
        ["delivered", ordersByStatus.delivered || 0],
        ["cancelled", ordersByStatus.cancelled || 0],
        ["returned", ordersByStatus.returned || 0],
      ],
      [ordersByStatus]
    );


  const ticketStatusData =
    useMemo(
      () => [
        ["open", ticketsByStatus.open || 0],
        [
          "in_progress",
          ticketsByStatus.in_progress || 0,
        ],
        [
          "resolved",
          ticketsByStatus.resolved || 0,
        ],
        [
          "escalated",
          ticketsByStatus.escalated || 0,
        ],
      ],
      [ticketsByStatus]
    );


  const priorityData =
    useMemo(
      () => [
        ["low", ticketsByPriority.low || 0],
        ["medium", ticketsByPriority.medium || 0],
        ["high", ticketsByPriority.high || 0],
        ["critical", ticketsByPriority.critical || 0],
      ],
      [ticketsByPriority]
    );


  if (loading) {
    return (
      <div className="analytics-page">

        <div className="analytics-loading">

          <div className="analytics-spinner" />

          <span>
            Loading analytics...
          </span>

        </div>

      </div>
    );
  }


  if (error) {
    return (
      <div className="analytics-page">

        <div className="analytics-error">
          <AlertTriangle size={18} />
          {error}
        </div>

      </div>
    );
  }


  return (
    <div className="analytics-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="analytics-header">

        <div>

          <p className="eyebrow">
            Overview
          </p>

          <h1>
            Analytics
          </h1>

          <p className="analytics-description">
            Live operational insights from your
            customer support platform.
          </p>

        </div>


        <div className="analytics-live">

          <span className="analytics-live-dot" />

          Live data

        </div>

      </div>


      {/* =====================================================
          KPI CARDS
          ===================================================== */}

      <div className="analytics-kpis">

        <StatCard
          icon={<Users size={18} />}
          label="Customers"
          value={
            analytics.totals.customers
          }
          detail={`${analytics.customers.active} active`}
        />


        <StatCard
          icon={<ShoppingBag size={18} />}
          label="Orders"
          value={orderTotal}
          detail="Across all statuses"
        />


        <StatCard
          icon={<Ticket size={18} />}
          label="Tickets"
          value={ticketTotal}
          detail={`${analytics.tickets.escalated} escalated`}
        />


        <StatCard
          icon={<MessageSquare size={18} />}
          label="Conversations"
          value={
            analytics.totals.conversations
          }
          detail="Stored conversations"
        />

      </div>


      {/* =====================================================
          PERFORMANCE
          ===================================================== */}

      <div className="analytics-performance">

        <MetricCard
          icon={
            <CheckCircle2 size={17} />
          }
          label="Resolution rate"
          value={`${(
            ticketResolutionRate * 100
          ).toFixed(1)}%`}
          description={`${analytics.tickets.resolved} resolved tickets`}
        />


        <MetricCard
          icon={
            <AlertTriangle size={17} />
          }
          label="Escalation rate"
          value={`${(
            ticketEscalationRate * 100
          ).toFixed(1)}%`}
          description={`${analytics.tickets.escalated} escalated tickets`}
        />


        <MetricCard
          icon={
            <UserCheck size={17} />
          }
          label="Assigned tickets"
          value={
            analytics.tickets.assigned
          }
          description="Currently assigned"
        />


        <MetricCard
          icon={
            <UserX size={17} />
          }
          label="Unassigned tickets"
          value={
            analytics.tickets.unassigned
          }
          description="Need attention"
        />

      </div>


      {/* =====================================================
          CHART GRID
          ===================================================== */}

      <div className="analytics-grid">

        {/* Orders */}

        <ChartCard
          title="Order status"
          subtitle={`${orderTotal} total orders`}
          icon={<Package size={16} />}
        >

          <div className="bar-list">

            {orderStatusData.map(
              ([status, value]) => (

                <BarRow
                  key={status}
                  label={formatLabel(
                    status
                  )}
                  value={value}
                  max={maxOrderStatus}
                  percentage={
                    orderTotal
                      ? (value /
                          orderTotal) *
                        100
                      : 0
                  }
                />

              )
            )}

          </div>

        </ChartCard>


        {/* Tickets */}

        <ChartCard
          title="Ticket status"
          subtitle={`${ticketTotal} total tickets`}
          icon={<Ticket size={16} />}
        >

          <div className="bar-list">

            {ticketStatusData.map(
              ([status, value]) => (

                <BarRow
                  key={status}
                  label={formatLabel(
                    status
                  )}
                  value={value}
                  max={maxTicketStatus}
                  percentage={
                    ticketTotal
                      ? (value /
                          ticketTotal) *
                        100
                      : 0
                  }
                />

              )
            )}

          </div>

        </ChartCard>


        {/* Priority */}

        <ChartCard
          title="Ticket priority"
          subtitle="Distribution by priority"
          icon={
            <AlertTriangle
              size={16}
            />
          }
        >

          <div className="bar-list">

            {priorityData.map(
              ([priority, value]) => (

                <BarRow
                  key={priority}
                  label={formatLabel(
                    priority
                  )}
                  value={value}
                  max={maxPriority}
                  percentage={
                    ticketTotal
                      ? (value /
                          ticketTotal) *
                        100
                      : 0
                  }
                />

              )
            )}

          </div>

        </ChartCard>


        {/* Customer status */}

        <ChartCard
          title="Customer activity"
          subtitle="Current customer distribution"
          icon={<Users size={16} />}
        >

          <div className="customer-status-grid">

            <div className="customer-stat">

              <div className="customer-stat-icon">
                <UserCheck size={17} />
              </div>

              <div>

                <span>
                  Active
                </span>

                <strong>
                  {
                    analytics.customers
                      .active
                  }
                </strong>

              </div>

            </div>


            <div className="customer-stat">

              <div className="customer-stat-icon">
                <UserX size={17} />
              </div>

              <div>

                <span>
                  Inactive
                </span>

                <strong>
                  {
                    analytics.customers
                      .inactive
                  }
                </strong>

              </div>

            </div>

          </div>


          <div className="customer-ratio">

            <div
              className="customer-ratio-fill"
              style={{
                width: `${
                  analytics.totals
                    .customers
                    ? (
                        analytics
                          .customers
                          .active /
                        analytics
                          .totals
                          .customers
                      ) * 100
                    : 0
                }%`,
              }}
            />

          </div>


          <div className="customer-ratio-label">

            <span>
              Active customer ratio
            </span>

            <strong>
              {analytics.totals
                .customers
                ? (
                    (
                      analytics
                        .customers
                        .active /
                      analytics
                        .totals
                        .customers
                    ) * 100
                  ).toFixed(1)
                : "0.0"}%
            </strong>

          </div>

        </ChartCard>

      </div>


      {/* =====================================================
          SUPPORT SUMMARY
          ===================================================== */}

      <div className="support-summary">

        <div>

          <p className="eyebrow">
            Support health
          </p>

          <h2>
            Current workload
          </h2>

        </div>


        <div className="support-summary-items">

  <SummaryItem
    label="Open"
    value={
      analytics.tickets
        .by_status.open
    }
  />

  <SummaryItem
    label="In progress"
    value={
      analytics.tickets
        .by_status.in_progress
    }
  />

  <SummaryItem
    label="Resolved"
    value={
      analytics.tickets
        .by_status.resolved
    }
  />

  <SummaryItem
    label="Escalated"
    value={
      analytics.tickets
        .by_status.escalated
    }
  />

</div>

      </div>

    </div>
  );
}


/* ============================================================
   Components
   ============================================================ */

function StatCard({
  icon,
  label,
  value,
  detail,
}) {
  return (
    <div className="analytics-card stat-card">

      <div className="stat-icon">
        {icon}
      </div>

      <div className="stat-content">

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {detail}
        </small>

      </div>

    </div>
  );
}


function MetricCard({
  icon,
  label,
  value,
  description,
}) {
  return (
    <div className="analytics-card metric-card">

      <div className="metric-top">

        <div className="metric-icon">
          {icon}
        </div>

        <span>
          {label}
        </span>

      </div>

      <strong>
        {value}
      </strong>

      <small>
        {description}
      </small>

    </div>
  );
}


function ChartCard({
  title,
  subtitle,
  icon,
  children,
}) {
  return (
    <div className="analytics-card chart-card">

      <div className="chart-header">

        <div className="chart-title">

          <div className="chart-icon">
            {icon}
          </div>

          <div>

            <h3>
              {title}
            </h3>

            <span>
              {subtitle}
            </span>

          </div>

        </div>

      </div>

      <div className="chart-body">
        {children}
      </div>

    </div>
  );
}


function BarRow({
  label,
  value,
  max,
  percentage,
}) {
  const width =
    max > 0
      ? (value / max) * 100
      : 0;

  return (
    <div className="bar-row">

      <div className="bar-label">

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>


      <div className="bar-track">

        <div
          className="bar-fill"
          style={{
            width: `${width}%`,
          }}
        />

      </div>


      <span className="bar-percentage">
        {percentage.toFixed(1)}%
      </span>

    </div>
  );
}


function SummaryItem({
  label,
  value,
}) {
  return (
    <div className="summary-item">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


/* ============================================================
   Helpers
   ============================================================ */

function formatLabel(value) {
  return value
    .replace("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}


export default Analytics;