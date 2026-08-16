import { useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useFetch } from "../api/useFetch";
import { apiFetch } from "../api/client";
import { canDeleteParts, filterAccessibleWorkOrders } from "../utils/permissions";
import { formatCurrency, formatDateTime } from "../utils/format";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ErrorState from "../components/ui/ErrorState";
import Notice from "../components/ui/Notice";
import LoadingState from "../components/ui/States";
import WorkOrderSelector from "../components/work-orders/WorkOrderSelector";
import Icon from "../components/Icon";

const EMPTY_FORM = { partName: "", quantity: "1", unitCost: "0.00" };

function PartFormModal({ open, part, busy, onSubmit, onClose }) {
  const [form, setForm] = useState(
    part
      ? {
          partName: part.partName,
          quantity: String(part.quantity),
          unitCost: String(part.unitCost),
        }
      : EMPTY_FORM,
  );
  const [error, setError] = useState("");

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await onSubmit({
        partName: form.partName,
        quantity: Number(form.quantity),
        unitCost: Number(form.unitCost),
      });
      setForm(EMPTY_FORM);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save part");
    }
  };

  return (
    <Modal open={open} title={part ? `Edit Part #${part.id}` : "Add Part"} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} noValidate>
        {error && <Notice kind="error">{error}</Notice>}

        <div className="form-group">
          <label className="form-label" htmlFor="part-name">Part Name</label>
          <input
            id="part-name"
            className="form-input"
            type="text"
            value={form.partName}
            onChange={(e) => setField("partName", e.target.value)}
            required
          />
        </div>

        <div className="form-grid form-grid--2">
          <div className="form-group">
            <label className="form-label" htmlFor="part-quantity">Quantity</label>
            <input
              id="part-quantity"
              className="form-input"
              type="number"
              min="1"
              step="1"
              value={form.quantity}
              onChange={(e) => setField("quantity", e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="part-cost">Unit Cost ($)</label>
            <input
              id="part-cost"
              className="form-input"
              type="number"
              min="0"
              step="0.01"
              value={form.unitCost}
              onChange={(e) => setField("unitCost", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="modal__actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn-primary btn-primary--auto" disabled={busy}>
            {busy ? "Saving..." : part ? "Save Changes" : "Add Part"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function PartsPage() {
  const { user } = useAuth();
  const role = user?.role;

  const { data: workOrders, error: workOrdersError, reload: reloadWorkOrders } =
    useFetch("/api/work-orders");

  const [selectedId, setSelectedId] = useState(null);
  const accessibleWorkOrders = useMemo(
    () => filterAccessibleWorkOrders(workOrders, role, user?.username),
    [workOrders, role, user?.username],
  );

  const selectedWorkOrder = accessibleWorkOrders.find((wo) => wo.id === selectedId) || null;

  const partsQuery = useFetch(
    selectedId ? `/api/work-orders/${selectedId}/parts` : null,
    { enabled: Boolean(selectedId) },
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const canDelete = canDeleteParts(role);

  const handleSave = async (payload) => {
    setBusy(true);
    try {
      if (editing) {
        await apiFetch(`/api/parts/${editing.id}`, { method: "PUT", body: payload });
        setNotice(`Part "${editing.partName}" updated`);
      } else {
        await apiFetch(`/api/work-orders/${selectedId}/parts`, {
          method: "POST",
          body: payload,
        });
        setNotice("Part added");
      }
      await partsQuery.reload();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await apiFetch(`/api/parts/${deleting.id}`, { method: "DELETE" });
      setNotice(`Part "${deleting.partName}" deleted`);
      setDeleting(null);
      await partsQuery.reload();
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: "id", header: "ID", render: (row) => `#${row.id}` },
    { key: "partName", header: "Part Name" },
    { key: "quantity", header: "Qty" },
    { key: "unitCost", header: "Unit Cost", render: (row) => formatCurrency(row.unitCost) },
    { key: "total", header: "Total", render: (row) => formatCurrency(Number(row.unitCost) * Number(row.quantity)) },
    { key: "createdAt", header: "Added", render: (row) => formatDateTime(row.createdAt) },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="btn-icon"
            title="Edit part"
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
              title="Delete part"
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
        <PageHeader title="Parts" subtitle="Manage parts used on work orders." />
        <Notice kind="error">No work orders exist yet. Create a work order to start managing parts.</Notice>
      </div>
    );
  }

  if (workOrders && accessibleWorkOrders.length === 0) {
    return (
      <div className="page">
        <PageHeader title="Parts" subtitle="Manage parts used on work orders." />
        <Notice kind="error">
          {role === "TECHNICIAN"
            ? "You have no assigned work orders yet. Parts can be managed once you are assigned to a work order."
            : "No work orders are available to manage parts for."}
        </Notice>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Parts"
        subtitle="Track parts and materials used on each work order."
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
              <span>Add Part</span>
            </button>
          ) : undefined
        }
      />

      {notice && <Notice onClose={() => setNotice("")}>{notice}</Notice>}

      <div className="filters">
        <WorkOrderSelector
          workOrders={accessibleWorkOrders}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      {!selectedId ? (
        <div className="panel">
          <div className="panel__body panel__body--center">
            <p className="state-block__label">
              {role === "TECHNICIAN"
                ? "Select one of your assigned work orders to view its parts."
                : "Select a work order to view its parts."}
            </p>
          </div>
        </div>
      ) : partsQuery.loading ? (
        <LoadingState label="Loading parts..." />
      ) : partsQuery.error ? (
        <ErrorState message={partsQuery.error.message} onRetry={partsQuery.reload} />
      ) : (
        <DataTable
          columns={columns}
          rows={partsQuery.data}
          emptyMessage="No parts recorded for this work order yet."
        />
      )}

      {formOpen && (
        <PartFormModal
          key={editing?.id ?? "new"}
          open={formOpen}
          part={editing}
          busy={busy}
          onSubmit={handleSave}
          onClose={() => setFormOpen(false)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete part"
        message={`Are you sure you want to delete part "${deleting?.partName}"? This action cannot be undone.`}
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}