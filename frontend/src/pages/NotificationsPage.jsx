import { useMemo, useState } from "react";
import { useFetch } from "../api/useFetch";
import { apiFetch } from "../api/client";
import { formatDateTime } from "../utils/format";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import Notice from "../components/ui/Notice";
import LoadingState from "../components/ui/States";
import { NotificationBadge } from "../components/ui/Badge";
import Icon from "../components/Icon";

export default function NotificationsPage() {
  const { data: notifications, loading, error, reload } = useFetch("/api/notifications");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState("");

  const visible = useMemo(() => {
    if (!notifications) return [];
    return unreadOnly ? notifications.filter((n) => !n.read) : notifications;
  }, [notifications, unreadOnly]);

  const unreadCount = useMemo(
    () => (notifications || []).filter((n) => !n.read).length,
    [notifications],
  );

  const markRead = async (notification) => {
    setBusyId(notification.id);
    try {
      await apiFetch(`/api/notifications/${notification.id}/read`, { method: "PATCH" });
      await reload();
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    if (!notifications) return;
    setBusyId("all");
    try {
      const unread = notifications.filter((n) => !n.read);
      for (const notification of unread) {
        await apiFetch(`/api/notifications/${notification.id}/read`, { method: "PATCH" });
      }
      setNotice(`${unread.length} notification${unread.length === 1 ? "" : "s"} marked as read`);
      await reload();
    } finally {
      setBusyId(null);
    }
  };

  if (error) {
    return <ErrorState message={error.message} onRetry={reload} />;
  }

  return (
    <div className="page">
      <PageHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
            : "You're all caught up."
        }
        action={
          unreadCount > 0 ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={markAllRead}
              disabled={busyId === "all"}
            >
              <Icon name="check" size={16} />
              <span>Mark all as read</span>
            </button>
          ) : undefined
        }
      />

      {notice && <Notice onClose={() => setNotice("")}>{notice}</Notice>}

      <div className="filters">
        <label className="toggle">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          />
          <span>Unread only</span>
        </label>
      </div>

      {loading ? (
        <LoadingState label="Loading notifications..." />
      ) : visible.length === 0 ? (
        <EmptyState
          title={unreadOnly ? "No unread notifications" : "No notifications"}
          message={unreadOnly ? "You've read everything." : "New notifications will appear here."}
          icon="bell"
        />
      ) : (
        <ul className="notification-list">
          {visible.map((notification) => (
            <li
              key={notification.id}
              className={`notification-list__item${notification.read ? " notification-list__item--read" : ""}`}
            >
              <div className="notification-list__content">
                <p className="notification-list__message">{notification.message}</p>
                <div className="notification-list__meta">
                  <NotificationBadge type={notification.type} />
                  <span className="notification-list__date">{formatDateTime(notification.createdAt)}</span>
                </div>
              </div>
              {!notification.read && (
                <button
                  type="button"
                  className="btn-icon btn-icon--success"
                  title="Mark as read"
                  onClick={() => markRead(notification)}
                  disabled={busyId === notification.id}
                >
                  <Icon name="check" size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}