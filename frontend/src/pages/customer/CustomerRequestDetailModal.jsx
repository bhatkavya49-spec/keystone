import Modal from "../../components/ui/Modal";
import { StatusBadge, PriorityBadge, SlaBadge } from "../../components/ui/Badge";
import { formatDateTime, titleCase } from "../../utils/format";
import { computeSlaStatus } from "../../utils/sla";
import StatusSteps from "../../components/customer/StatusSteps";

function DetailRow({ label, children }) {
  return (
    <div className="detail-row">
      <span className="detail-row__label">{label}</span>
      <span className="detail-row__value">{children}</span>
    </div>
  );
}

export default function CustomerRequestDetailModal({ open, workOrder, onClose }) {
  if (!workOrder) {
    return null;
  }

  return (
    <Modal open={open} title={`Request #${workOrder.id}`} onClose={onClose} size="md">
      <div className="detail">
        <DetailRow label="Title">{workOrder.title}</DetailRow>
        <DetailRow label="Description">{workOrder.description || "—"}</DetailRow>
        <DetailRow label="Status">
          <StatusBadge status={workOrder.status} dot />
        </DetailRow>
        <DetailRow label="Priority">
          <PriorityBadge priority={workOrder.priority} dot />
        </DetailRow>
        <DetailRow label="Site">{workOrder.site?.siteName || "—"}</DetailRow>
        <DetailRow label="Assigned Worker">
          {workOrder.assignedTechnician?.username || "Not assigned yet"}
        </DetailRow>
        <DetailRow label="SLA">
          <div className="detail-row__sla">
            <SlaBadge status={computeSlaStatus(workOrder.slaDueAt)} />
            {workOrder.slaDueAt && (
              <span className="detail-row__sla-due">Due {formatDateTime(workOrder.slaDueAt)}</span>
            )}
          </div>
        </DetailRow>
        <DetailRow label="Submitted">{formatDateTime(workOrder.createdAt)}</DetailRow>
        <DetailRow label="Scheduled">
          {workOrder.scheduledAt ? formatDateTime(workOrder.scheduledAt) : "—"}
        </DetailRow>
        <DetailRow label="Completed">
          {workOrder.completedAt ? formatDateTime(workOrder.completedAt) : "—"}
        </DetailRow>
        <DetailRow label="SLA Status">
          {workOrder.slaStatus ? titleCase(workOrder.slaStatus) : "Not evaluated"}
        </DetailRow>
      </div>

      <div className="modal__section">
        <h4 className="modal__section-title">Service progress</h4>
        <StatusSteps status={workOrder.status} />
      </div>

      <div className="modal__actions">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}