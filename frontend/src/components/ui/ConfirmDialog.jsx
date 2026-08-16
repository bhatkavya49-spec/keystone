import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel} size="sm">
      <p className="confirm-dialog__message">{message}</p>
      <div className="confirm-dialog__actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="btn-danger" onClick={onConfirm} disabled={busy}>
          {busy ? "Working..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}