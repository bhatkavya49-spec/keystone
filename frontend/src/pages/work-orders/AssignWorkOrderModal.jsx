import { useState, useEffect } from "react";
import Modal from "../../components/ui/Modal";
import Notice from "../../components/ui/Notice";
import { apiFetch } from "../../api/client";

export default function AssignWorkOrderModal({ open, workOrder, busy, onSubmit, onClose }) {
  const [technicianId, setTechnicianId] = useState("");
  const [technicians, setTechnicians] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

useEffect(() => {
    setLoading(true);
    setError("");
    setTechnicians([]);
    apiFetch("/api/work-orders/technicians")
      .then((data) => {
        setTechnicians(data);
      })
      .catch(() => {
        setError("Failed to load technicians");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!technicianId) {
      setError("Please select a technician");
      return;
    }
    setError("");
    try {
      await onSubmit({ technicianId: Number(technicianId) });
      setTechnicianId("");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to assign work order");
    }
  };

  return (
    <Modal
      open={open}
      title={`Assign Work Order #${workOrder?.id}`}
      onClose={onClose}
      size="sm"
    >
      <form onSubmit={handleSubmit} noValidate>
        {error && <Notice kind="error">{error}</Notice>}

        <p className="modal__lead">
          {workOrder?.assignedTechnician
            ? `Currently assigned to ${workOrder.assignedTechnician.username}.`
            : "This work order is currently unassigned."}
        </p>

        <div className="form-group">
          <label className="form-label" htmlFor="assign-technician">
            Technician
            <span className="form-hint">Select a technician to assign the work order.</span>
          </label>
          <select
            id="assign-technician"
            className="form-input"
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
            required
          >
            <option value="">-- Select a technician --</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.username}
              </option>
            ))}
          </select>
          {loading && <span>Loading technicians...</span>}
        </div>

        <div className="modal__actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn-primary btn-primary--auto" disabled={busy || !technicianId}>
            {busy ? "Assigning..." : "Assign Technician"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
