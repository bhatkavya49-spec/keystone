import Icon from "../Icon";

export default function Notice({ kind = "success", children, onClose }) {
  return (
    <div className={`notice notice--${kind}`} role={kind === "error" ? "alert" : "status"}>
      <Icon name={kind === "error" ? "alert" : "check"} size={16} />
      <span>{children}</span>
      {onClose && (
        <button type="button" className="notice__close" onClick={onClose} aria-label="Dismiss">
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  );
}