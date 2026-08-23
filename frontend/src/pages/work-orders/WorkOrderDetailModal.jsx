import { Link } from "react-router-dom";
import Modal from "../../components/ui/Modal";
import { StatusBadge, PriorityBadge, SlaBadge } from "../../components/ui/Badge";
import { formatDateTime, titleCase } from "../../utils/format";
import { computeSlaStatus } from "../../utils/sla";
import Icon from "../../components/Icon";

function DetailRow({ label, children }) {
  return (
    <div className="detail-row">
      <span className="detail-row__label">{label}</span>
      <span className="detail-row__value">{children}</span>
    </div>
  );
}

export default function WorkOrderDetailModal({
  open,
  workOrder,
  history = [],
  canEdit,
  canAssign,
  canStart,
  canComplete,
  canDelete,
  canOpenParts,
  canOpenTime,
  busy,
  onEdit,
  onAssign,
  onStart,
  onComplete,
  onDelete,
  onClose,
}) {
  if (!workOrder) {
    return null;
  }

  return (
    <Modal open={open} title={`Work Order #${workOrder.id}`} onClose={onClose} size="md">
      <div className="detail">
        <DetailRow label="Title">{workOrder.title}</DetailRow>
        <DetailRow label="Description">{workOrder.description || "—"}</DetailRow>
        <DetailRow label="Status">
          <StatusBadge status={workOrder.status} />
        </DetailRow>
        <DetailRow label="Priority">
          <PriorityBadge priority={workOrder.priority} />
        </DetailRow>
        <DetailRow label="Customer">{workOrder.customer?.name || "—"}</DetailRow>
        <DetailRow label="Site">{workOrder.site?.siteName || "—"}</DetailRow>
        <DetailRow label="Technician">
          {workOrder.assignedTechnician?.username
            ? `${workOrder.assignedTechnician.username} (#${workOrder.assignedTechnician.id})`
            : "Unassigned"}
        </DetailRow>
        <DetailRow label="SLA">
          <div className="detail-row__sla">
            <SlaBadge status={computeSlaStatus(workOrder.slaDueAt)} />
            {workOrder.slaDueAt && (
              <span className="detail-row__sla-due">Due {formatDateTime(workOrder.slaDueAt)}</span>
            )}
          </div>
        </DetailRow>
        <DetailRow label="Created">{formatDateTime(workOrder.createdAt)}</DetailRow>
        <DetailRow label="Scheduled">
          {workOrder.scheduledAt ? formatDateTime(workOrder.scheduledAt) : "—"}
        </DetailRow>
        <DetailRow label="Completed">
          {workOrder.completedAt ? formatDateTime(workOrder.completedAt) : "—"}
        </DetailRow>
        <DetailRow label="SLA Status (stored)">
          {workOrder.slaStatus ? titleCase(workOrder.slaStatus) : "Not evaluated"}
        </DetailRow>
      </div>

      {history.length > 0 && (
        <div className="modal__section">
          <h4 className="modal__section-title">Status history</h4>
          <ol className="history-list">
            {history.map((entry) => (
              <li key={entry.id} className="history-list__item">
                <div className="history-list__row">
                  <StatusBadge status={entry.fromStatus} />
                  <Icon name="chevronRight" size={14} />
                  <StatusBadge status={entry.toStatus} />
                  <span className="history-list__meta">
                    {entry.changedBy ? `by ${entry.changedBy}` : ""}
                    {" · "}
                    {entry.changedAt ? formatDateTime(entry.changedAt) : ""}
                  </span>
                </div>
                {entry.note && <div className="history-list__note">{entry.note}</div>}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="modal__actions modal__actions--wrap">
        {canStart && (
          <button type="button" className="btn-primary btn-primary--auto" onClick={onStart} disabled={busy}>
            <Icon name="play" size={16} />
            <span>Start Work</span>
          </button>
        )}
        {canComplete && (
          <button type="button" className="btn-primary btn-primary--auto" onClick={onComplete} disabled={busy}>
            <Icon name="check" size={16} />
            <span>Complete Work</span>
          </button>
        )}
        {canAssign && (
          <button type="button" className="btn-secondary" onClick={onAssign} disabled={busy}>
            <Icon name="userPlus" size={16} />
            <span>Assign</span>
          </button>
        )}
        {canOpenParts && (
          <Link className="btn-secondary" to={`/parts?wo=${workOrder.id}`} onClick={onClose}>
            <Icon name="parts" size={16} />
            <span>Parts</span>
          </Link>
        )}
        {canOpenTime && (
          <Link className="btn-secondary" to={`/time-tracking?wo=${workOrder.id}`} onClick={onClose}>
            <Icon name="timeTracking" size={16} />
            <span>Time</span>
          </Link>
        )}
        {canEdit && (
          <button type="button" className="btn-secondary" onClick={onEdit} disabled={busy}>
            <Icon name="edit" size={16} />
            <span>Edit</span>
          </button>
        )}
        {canDelete && (
          <button type="button" className="btn-danger btn-danger--ghost" onClick={onDelete} disabled={busy}>
            <Icon name="trash" size={16} />
            <span>Delete</span>
          </button>
        )}
        <button type="button" className="btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}