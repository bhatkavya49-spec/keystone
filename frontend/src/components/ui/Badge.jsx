import Icon from "../Icon";

export default function Badge({ tone = "neutral", children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function StatusBadge({ status }) {
  const tones = {
    NEW: "neutral",
    ASSIGNED: "info",
    IN_PROGRESS: "warning",
    COMPLETED: "success",
  };
  return <Badge tone={tones[status] || "neutral"}>{status}</Badge>;
}

export function PriorityBadge({ priority }) {
  const tones = {
    LOW: "neutral",
    MEDIUM: "info",
    HIGH: "warning",
    URGENT: "danger",
  };
  return <Badge tone={tones[priority] || "neutral"}>{priority}</Badge>;
}

export function SlaBadge({ status }) {
  if (!status) return <Badge tone="neutral">No SLA</Badge>;
  const tones = {
    ON_TRACK: "success",
    AT_RISK: "warning",
    BREACHED: "danger",
  };
  return <Badge tone={tones[status] || "neutral"}>{status.replace("_", " ")}</Badge>;
}

export function NotificationBadge({ type }) {
  const tones = {
    WORK_ORDER_ASSIGNED: "info",
    SLA_AT_RISK: "warning",
    SLA_BREACHED: "danger",
  };
  return <Badge tone={tones[type] || "neutral"}>{type.replaceAll("_", " ")}</Badge>;
}

export function IconBadge({ icon, tone = "neutral", children }) {
  return (
    <span className={`badge badge--${tone} badge--with-icon`}>
      <Icon name={icon} size={14} />
      <span>{children}</span>
    </span>
  );
}