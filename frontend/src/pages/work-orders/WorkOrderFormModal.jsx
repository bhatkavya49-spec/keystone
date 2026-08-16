import { useMemo, useState } from "react";
import Modal from "../../components/ui/Modal";
import Notice from "../../components/ui/Notice";
import { toLocalInputValue } from "../../utils/format";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUSES = ["NEW", "ASSIGNED", "IN_PROGRESS", "COMPLETED"];

export default function WorkOrderFormModal({ open, workOrder, customers, sites, busy, onSubmit, onClose }) {
  const [form, setForm] = useState(() => {
    if (workOrder) {
      return {
        title: workOrder.title,
        description: workOrder.description || "",
        customerId: String(workOrder.customer?.id ?? ""),
        siteId: workOrder.site ? String(workOrder.site.id) : "",
        priority: workOrder.priority,
        status: workOrder.status,
        scheduledAt: toLocalInputValue(workOrder.scheduledAt),
        technicianId: workOrder.assignedTechnician ? String(workOrder.assignedTechnician.id) : "",
      };
    }
    return {
      title: "",
      description: "",
      customerId: "",
      siteId: "",
      priority: "MEDIUM",
      status: "",
      scheduledAt: "",
      technicianId: "",
    };
  });
  const [error, setError] = useState("");

  const customerSites = useMemo(() => {
    if (!form.customerId) return [];
    return (sites || []).filter((site) => String(site.customer?.id) === form.customerId);
  }, [sites, form.customerId]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await onSubmit({
        title: form.title,
        description: form.description || null,
        customer: { id: Number(form.customerId) },
        site: form.siteId ? { id: Number(form.siteId) } : null,
        assignedTechnician: form.technicianId ? { id: Number(form.technicianId) } : null,
        priority: form.priority,
        status: form.status || null,
        scheduledAt: form.scheduledAt || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save work order");
    }
  };

  return (
    <Modal
      open={open}
      title={workOrder ? `Edit Work Order #${workOrder.id}` : "New Work Order"}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} noValidate>
        {error && <Notice kind="error">{error}</Notice>}

        <div className="form-group">
          <label className="form-label" htmlFor="wo-title">Title</label>
          <input
            id="wo-title"
            className="form-input"
            type="text"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="wo-description">Description</label>
          <textarea
            id="wo-description"
            className="form-input form-input--textarea"
            rows="3"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="wo-customer">Customer</label>
            <select
              id="wo-customer"
              className="form-select"
              value={form.customerId}
              onChange={(e) => {
                setField("customerId", e.target.value);
                setField("siteId", "");
              }}
              required
            >
              <option value="">Select a customer...</option>
              {customers?.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="wo-site">Site</label>
            <select
              id="wo-site"
              className="form-select"
              value={form.siteId}
              onChange={(e) => setField("siteId", e.target.value)}
              disabled={!form.customerId}
            >
              <option value="">No site</option>
              {customerSites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.siteName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="wo-priority">Priority</label>
            <select
              id="wo-priority"
              className="form-select"
              value={form.priority}
              onChange={(e) => setField("priority", e.target.value)}
              required
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="wo-scheduled">Scheduled At</label>
            <input
              id="wo-scheduled"
              className="form-input"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setField("scheduledAt", e.target.value)}
            />
          </div>

          {workOrder && (
            <div className="form-group">
              <label className="form-label" htmlFor="wo-status">Status</label>
              <select
                id="wo-status"
                className="form-select"
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="wo-technician">
              Technician ID
              <span className="form-hint">Optional — numeric user id of the assigned technician</span>
            </label>
            <input
              id="wo-technician"
              className="form-input"
              type="number"
              min="1"
              value={form.technicianId}
              onChange={(e) => setField("technicianId", e.target.value)}
              placeholder={workOrder?.assignedTechnician ? `Currently ${workOrder.assignedTechnician.username}` : "Leave blank for unassigned"}
            />
          </div>
        </div>

        <div className="modal__actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn-primary btn-primary--auto" disabled={busy}>
            {busy ? "Saving..." : workOrder ? "Save Changes" : "Create Work Order"}
          </button>
        </div>
      </form>
    </Modal>
  );
}