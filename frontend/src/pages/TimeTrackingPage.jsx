import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useFetch } from "../api/useFetch";
import { apiFetch } from "../api/client";
import { canDeleteTimeEntries, filterAccessibleWorkOrders } from "../utils/permissions";
import { formatDateTime, formatDuration, toLocalInputValue } from "../utils/format";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ErrorState from "../components/ui/ErrorState";
import Notice from "../components/ui/Notice";
import LoadingState from "../components/ui/States";
import WorkOrderSelector from "../components/work-orders/WorkOrderSelector";
import Icon from "../components/Icon";

function TimeEntryFormModal({ open, entry, workOrder, currentUser, busy, onSubmit, onClose }) {
  const isTechnician = currentUser?.role === "TECHNICIAN";
  const technicianId =
    isTechnician && workOrder?.assignedTechnician
      ? String(workOrder.assignedTechnician.id)
      : "";

  const [form, setForm] = useState(
    entry
      ? {
          startTime: toLocalInputValue(entry.startTime),
          endTime: toLocalInputValue(entry.endTime),
          technicianId: String(entry.technician?.id ?? ""),
        }
      : {
          startTime: "",
          endTime: "",
          technicianId,
        },
  );
  const [error, setError] = useState("");

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await onSubmit({
        startTime: form.startTime,
        endTime: form.endTime || null,
        technician: { id: Number(form.technicianId) },
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save time entry");
    }
  };

  return (
    <Modal open={open} title={entry ? `Edit Time Entry #${entry.id}` : "Add Time Entry"} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} noValidate>
        {error && <Notice kind="error">{error}</Notice>}

        {!isTechnician && (
          <div className="form-group">
            <label className="form-label" htmlFor="te-technician">
              Technician ID
              <span className="form-hint">Numeric user id of the technician.</span>
            </label>
            <input
              id="te-technician"
              className="form-input"
              type="number"
              min="1"
              value={form.technicianId}
              onChange={(e) => setField("technicianId", e.target.value)}
              required
              placeholder="e.g. 3"
            />
          </div>
        )}
        {isTechnician && (
          <p className="modal__lead">
            Recording time for {currentUser.username}
            {workOrder?.assignedTechnician ? ` (#${workOrder.assignedTechnician.id})` : ""}.
          </p>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="te-start">Start Time</label>
          <input
            id="te-start"
            className="form-input"
            type="datetime-local"
            value={form.startTime}
            onChange={(e) => setField("startTime", e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="te-end">End Time</label>
          <input
            id="te-end"
            className="form-input"
            type="datetime-local"
            value={form.endTime}
            onChange={(e) => setField("endTime", e.target.value)}
          />
        </div>

        <div className="modal__actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn-primary btn-primary--auto" disabled={busy}>
            {busy ? "Saving..." : entry ? "Save Changes" : "Add Time Entry"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function TimeTrackingPage() {
  const { user } = useAuth();
  const role = user?.role;

  const { data: workOrders, error: workOrdersError, reload: reloadWorkOrders } =
    useFetch("/api/work-orders");

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState(() => {
    const fromQuery = searchParams.get("wo");
    return fromQuery ? Number(fromQuery) : null;
  });
  const accessibleWorkOrders = useMemo(
    () => filterAccessibleWorkOrders(workOrders, role, user?.username),
    [workOrders, role, user?.username],
  );

  const handleSelect = (id) => {
    setSelectedId(id);
    setSearchParams(id ? { wo: String(id) } : {}, { replace: true });
  };

  const selectedWorkOrder = accessibleWorkOrders.find((wo) => wo.id === selectedId) || null;

  const entriesQuery = useFetch(
    selectedWorkOrder ? `/api/work-orders/${selectedWorkOrder.id}/time-entries` : null,
    { enabled: Boolean(selectedWorkOrder) },
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const canDelete = canDeleteTimeEntries(role);

  const handleSave = async (payload) => {
    setBusy(true);
    try {
      if (editing) {
        await apiFetch(`/api/time-entries/${editing.id}`, { method: "PUT", body: payload });
        setNotice("Time entry updated");
      } else {
        await apiFetch(`/api/work-orders/${selectedId}/time-entries`, {
          method: "POST",
          body: payload,
        });
        setNotice("Time entry added");
      }
      await entriesQuery.reload();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await apiFetch(`/api/time-entries/${deleting.id}`, { method: "DELETE" });
      setNotice("Time entry deleted");
      setDeleting(null);
      await entriesQuery.reload();
    } finally {
      setBusy(false);
    }
  };

  const totalDuration = (entriesQuery.data || []).reduce(
    (sum, entry) => sum + Number(entry.durationMinutes || 0),
    0,
  );

  const columns = [
    { key: "id", header: "ID", render: (row) => `#${row.id}` },
    { key: "technician", header: "Technician", render: (row) => row.technician?.username || "—" },
    { key: "startTime", header: "Start", render: (row) => formatDateTime(row.startTime) },
    { key: "endTime", header: "End", render: (row) => (row.endTime ? formatDateTime(row.endTime) : "In progress") },
    { key: "duration", header: "Duration", render: (row) => formatDuration(row.durationMinutes) },
    { key: "createdAt", header: "Logged", render: (row) => formatDateTime(row.createdAt) },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="btn-icon"
            title="Edit time entry"
            onClick={() => {
              setEditing(row);
              setFormOpen(true);
            }}
          >
            <Icon name="edit" size={16} />
          </button>
          {canDelete && (
            <button
              type="button"
              className="btn-icon btn-icon--danger"
              title="Delete time entry"
              onClick={() => setDeleting(row)}
            >
              <Icon name="trash" size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (workOrdersError) {
    return <ErrorState message={workOrdersError.message} onRetry={reloadWorkOrders} />;
  }

  if (workOrders?.length === 0) {
    return (
      <div className="page">
        <PageHeader title="Time Tracking" subtitle="Log time spent on work orders." />
        <Notice kind="error">No work orders exist yet. Create a work order to start tracking time.</Notice>
      </div>
    );
  }

  if (workOrders && accessibleWorkOrders.length === 0) {
    return (
      <div className="page">
        <PageHeader title="Time Tracking" subtitle="Log time spent on work orders." />
        <Notice kind="error">
          {role === "TECHNICIAN"
            ? "You have no assigned work orders yet. Time can be tracked once you are assigned to a work order."
            : "No work orders are available to track time for."}
        </Notice>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Time Tracking"
        subtitle="Log and review time spent on work orders."
        action={
          selectedWorkOrder ? (
            <button
              type="button"
              className="btn-primary btn-primary--auto"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Icon name="plus" size={16} />
              <span>Add Time Entry</span>
            </button>
          ) : undefined
        }
      />

      {notice && <Notice onClose={() => setNotice("")}>{notice}</Notice>}

      <div className="filters">
        <WorkOrderSelector
          workOrders={accessibleWorkOrders}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      {!selectedId ? (
        <div className="panel">
          <div className="panel__body panel__body--center">
            <p className="state-block__label">
              {role === "TECHNICIAN"
                ? "Select one of your assigned work orders to view its time entries."
                : "Select a work order to view its time entries."}
            </p>
          </div>
        </div>
      ) : entriesQuery.loading ? (
        <LoadingState label="Loading time entries..." />
      ) : entriesQuery.error ? (
        <ErrorState message={entriesQuery.error.message} onRetry={entriesQuery.reload} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={entriesQuery.data}
            emptyMessage="No time entries recorded for this work order yet."
          />
          {entriesQuery.data?.length > 0 && (
            <div className="summary-bar">
              <span className="summary-bar__label">Total logged time for this work order</span>
              <span className="summary-bar__value">{formatDuration(totalDuration)}</span>
            </div>
          )}
        </>
      )}

      {formOpen && (
        <TimeEntryFormModal
          key={editing?.id ?? "new"}
          open={formOpen}
          entry={editing}
          workOrder={selectedWorkOrder}
          currentUser={user}
          busy={busy}
          onSubmit={handleSave}
          onClose={() => setFormOpen(false)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete time entry"
        message="Are you sure you want to delete this time entry? This action cannot be undone."
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}