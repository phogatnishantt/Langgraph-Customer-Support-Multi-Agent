import { useEffect, useMemo, useState } from "react";

import {
  Search,
  Ticket as TicketIcon,
  X,
  UserRound,
  Package,
  CalendarDays,
  AlertCircle,
  Save,
} from "lucide-react";

import {
  getTickets,
  updateTicketStatus,
} from "../services/api";

import "./Tickets.css";


function Tickets() {
  const [tickets, setTickets] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedTicket, setSelectedTicket] =
    useState(null);

  const [error, setError] =
    useState("");


  useEffect(() => {
    loadTickets();
  }, []);


  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getTickets();

      setTickets(data);

    } catch (err) {
      console.error(
        "Failed to load tickets:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load tickets."
      );
    } finally {
      setLoading(false);
    }
  };


  const filteredTickets = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return tickets.filter((ticket) => {

      const matchesSearch =
        !query ||
        ticket.ticket_id
          ?.toLowerCase()
          .includes(query) ||
        ticket.customer_id
          ?.toLowerCase()
          .includes(query) ||
        ticket.order_number
          ?.toLowerCase()
          .includes(query) ||
        ticket.subject
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        ticket.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    tickets,
    search,
    statusFilter,
  ]);


  const handleTicketUpdated = (
    updatedTicket
  ) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.ticket_id ===
        updatedTicket.ticket_id
          ? updatedTicket
          : ticket
      )
    );

    setSelectedTicket(
      updatedTicket
    );
  };


  return (
    <div className="tickets-page">

      <div className="tickets-header">

        <div>

          <p className="eyebrow">
            Operations
          </p>

          <h1>
            Support Tickets
          </h1>

          <p className="page-description">
            Review customer issues and
            manage support workload.
          </p>

        </div>


        <div className="tickets-count">

          <TicketIcon size={16} />

          <span>
            {tickets.length} tickets
          </span>

        </div>

      </div>


      <div className="tickets-toolbar">

        <div className="ticket-search">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search ticket, customer, order, or issue..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>


        <div className="ticket-filters">

          {[
            "all",
            "open",
            "in_progress",
            "resolved",
            "escalated",
          ].map((status) => (

            <button
              key={status}
              className={`ticket-filter ${
                statusFilter === status
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setStatusFilter(
                  status
                )
              }
            >
              {status === "all"
                ? "All"
                : formatStatus(
                    status
                  )}
            </button>

          ))}

        </div>

      </div>


      {error && (

        <div className="tickets-error">

          <AlertCircle size={16} />

          {error}

        </div>

      )}


      {loading ? (

        <div className="tickets-loading">

          <div className="ticket-spinner" />

          <span>
            Loading tickets...
          </span>

        </div>

      ) : filteredTickets.length === 0 ? (

        <div className="tickets-empty">

          <TicketIcon size={22} />

          <h3>
            No tickets found
          </h3>

          <p>
            Try another search or
            status filter.
          </p>

        </div>

      ) : (

        <div className="tickets-content">

          <div className="tickets-table-card">

            <div className="tickets-table-head">

              <span>
                Ticket
              </span>

              <span>
                Issue
              </span>

              <span>
                Customer
              </span>

              <span>
                Priority
              </span>

              <span>
                Status
              </span>

            </div>


            <div className="tickets-table-body">

              {filteredTickets.map(
                (ticket) => (

                  <button
                    key={
                      ticket.ticket_id
                    }
                    className={`ticket-row ${
                      selectedTicket?.ticket_id ===
                      ticket.ticket_id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedTicket(
                        ticket
                      )
                    }
                  >

                    <div className="ticket-number">

                      <div className="ticket-icon">
                        <TicketIcon
                          size={15}
                        />
                      </div>


                      <div>

                        <strong>
                          {ticket.ticket_id}
                        </strong>

                        <span>
                          {formatDate(
                            ticket.created_at
                          )}
                        </span>

                      </div>

                    </div>


                    <div className="ticket-subject">
                      {ticket.subject ||
                        "Support request"}
                    </div>


                    <div className="ticket-customer">
                      {ticket.customer_id ||
                        "—"}
                    </div>


                    <div>

                      <span
                        className={`priority-badge ${
                          ticket.priority
                        }`}
                      >
                        {ticket.priority ||
                          "—"}
                      </span>

                    </div>


                    <div>

                      <span
                        className={`ticket-status-badge ${
                          ticket.status
                        }`}
                      >
                        {formatStatus(
                          ticket.status
                        )}
                      </span>

                    </div>

                  </button>

                )
              )}

            </div>

          </div>


          {selectedTicket && (

            <TicketDetails
              ticket={selectedTicket}
              onClose={() =>
                setSelectedTicket(
                  null
                )
              }
              onUpdated={
                handleTicketUpdated
              }
            />

          )}

        </div>

      )}

    </div>
  );
}


/* ============================================================
   Ticket Details
   ============================================================ */

function TicketDetails({
  ticket,
  onClose,
  onUpdated,
}) {
  const [status, setStatus] =
    useState(
      ticket.status || "open"
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


  useEffect(() => {
    setStatus(
      ticket.status || "open"
    );

    setError("");

  }, [
    ticket.ticket_id,
    ticket.status,
  ]);


  const saveStatus = async () => {

    if (
      status === ticket.status
    ) {
      return;
    }


    try {

      setSaving(true);
      setError("");


      const updatedTicket =
        await updateTicketStatus(
          ticket.ticket_id,
          status
        );


      onUpdated(
        updatedTicket
      );

    } catch (err) {

      console.error(
        "Failed to update ticket:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Failed to update ticket."
      );

    } finally {

      setSaving(false);

    }
  };


  return (
    <aside className="ticket-details">

      <div className="ticket-details-header">

        <div>

          <p className="eyebrow">
            Ticket details
          </p>

          <h2>
            {ticket.ticket_id}
          </h2>

        </div>


        <button
          className="close-ticket"
          onClick={onClose}
          aria-label="Close ticket details"
        >

          <X size={17} />

        </button>

      </div>


      <div className="ticket-summary">

        <div className="large-ticket-icon">

          <TicketIcon size={20} />

        </div>


        <div>

          <h3>
            {ticket.subject ||
              "Support request"}
          </h3>

          <span>
            {ticket.order_number ||
              "No linked order"}
          </span>

        </div>

      </div>


      {/* =====================================================
          Status management
          ===================================================== */}

      <div className="ticket-detail-section">

        <p className="details-label">
          Ticket status
        </p>


        <div className="ticket-status-editor">

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
            disabled={saving}
          >

            <option value="open">
              Open
            </option>

            <option value="in_progress">
              In Progress
            </option>

            <option value="resolved">
              Resolved
            </option>

            <option value="escalated">
              Escalated
            </option>

          </select>


          <button
            className="save-ticket-button"
            onClick={saveStatus}
            disabled={
              saving ||
              status === ticket.status
            }
          >

            <Save size={14} />

            {saving
              ? "Saving..."
              : "Save"}

          </button>

        </div>


        {error && (

          <div className="ticket-update-error">

            <AlertCircle size={14} />

            {error}

          </div>

        )}

      </div>


      <div className="ticket-detail-section">

        <p className="details-label">
          Issue
        </p>


        <div className="description-card">

          {ticket.description ||
            "No description provided."}

        </div>

      </div>


      <div className="ticket-detail-section">

        <p className="details-label">
          Ticket information
        </p>


        <div className="ticket-detail-row">

          <div className="ticket-detail-label">

            <UserRound size={14} />

            <span>
              Customer
            </span>

          </div>


          <strong>
            {ticket.customer_id ||
              "—"}
          </strong>

        </div>


        <div className="ticket-detail-row">

          <div className="ticket-detail-label">

            <Package size={14} />

            <span>
              Order
            </span>

          </div>


          <strong>
            {ticket.order_number ||
              "—"}
          </strong>

        </div>


        <div className="ticket-detail-row">

          <div className="ticket-detail-label">

            <CalendarDays
              size={14}
            />

            <span>
              Created
            </span>

          </div>


          <strong>
            {formatDate(
              ticket.created_at
            )}
          </strong>

        </div>


        {ticket.updated_at && (

          <div className="ticket-detail-row">

            <div className="ticket-detail-label">

              <CalendarDays
                size={14}
              />

              <span>
                Updated
              </span>

            </div>


            <strong>
              {formatDate(
                ticket.updated_at
              )}
            </strong>

          </div>

        )}

      </div>


      <div className="ticket-detail-section">

        <p className="details-label">
          Priority
        </p>


        <span
          className={`priority-badge large ${
            ticket.priority
          }`}
        >
          {ticket.priority ||
            "—"}
        </span>

      </div>


      <div className="ticket-detail-section">

        <p className="details-label">
          Assignment
        </p>


        <div className="assignment-card">

          <UserRound size={16} />

          <div>

            <span>
              Assigned to
            </span>

            <strong>
              {ticket.assigned_to ||
                "Unassigned"}
            </strong>

          </div>

        </div>

      </div>

    </aside>
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


export default Tickets;