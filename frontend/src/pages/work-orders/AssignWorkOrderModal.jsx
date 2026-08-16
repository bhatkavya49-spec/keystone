import { useState } from "react";
import Modal from "../../components/ui/Modal";
import Notice from "../../components/ui/Notice";

export default function AssignWorkOrderModal({ open, workOrder, busy, onSubmit, onClose }) {
  const [technicianId, setTechnicianId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
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
            Technician ID
            <span className="form-hint">Enter the numeric user id of the technician to assign.</span>
          </label>
          <input
            id="assign-technician"
            className="form-input"
            type="number"
            min="1"
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
            required
            placeholder="e.g. 3"
          />
        </div>

        <div className="modal__actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn-primary btn-primary--auto" disabled={busy}>
            {busy ? "Assigning..." : "Assign Technician"}
          </button>
        </div>
      </form>
    </Modal>
  );
}