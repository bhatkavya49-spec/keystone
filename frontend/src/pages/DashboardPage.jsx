import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useFetch } from "../api/useFetch";
import { canUseCustomerApis } from "../utils/permissions";
import { computeSlaStatus } from "../utils/sla";
import { formatDateTime } from "../utils/format";
import { StatusBadge, SlaBadge, NotificationBadge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/States";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import Icon from "../components/Icon";

const ROLE_MESSAGES = {
  MANAGER: "Oversee customers, sites, work orders, and service level agreements across the organization.",
  DISPATCHER: "Manage customers, sites, work orders, and ensure service level agreements are met.",
  TECHNICIAN: "Work on assigned work orders, track your time, and manage parts for jobs in the field.",
  CUSTOMER: "View your dashboard to stay up to date with your service requests.",
};

function computeStats(workOrders) {
  if (!workOrders || workOrders.length === 0) {
    return {
      total: 0,
      open: 0,
      completed: 0,
      breached: 0,
      atRisk: 0,
      onTrack: 0,
      withSla: 0,
    };
  }

  const open = workOrders.filter((wo) =>
    ["NEW", "ASSIGNED", "IN_PROGRESS"].includes(wo.status),
  ).length;
  const completed = workOrders.filter((wo) => wo.status === "COMPLETED").length;

  let breached = 0;
  let atRisk = 0;
  let onTrack = 0;
  let withSla = 0;

  workOrders.forEach((wo) => {
    if (!wo.slaDueAt) return;
    withSla += 1;
    const status = computeSlaStatus(wo.slaDueAt);
    if (status === "BREACHED") breached += 1;
    else if (status === "AT_RISK") atRisk += 1;
    else if (status === "ON_TRACK") onTrack += 1;
  });

  return { total: workOrders.length, open, completed, breached, atRisk, onTrack, withSla };
}

function StatCard({ label, value, tone }) {
  return (
    <div className="stat-card">
      <span className="stat-card__label">{label}</span>
      <span className={`stat-card__value${tone ? ` stat-card__value--${tone}` : ""}`}>
        {value}
      </span>
    </div>
  );
}

function CustomerDashboard() {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <section className="welcome-card">
        <h2 className="welcome-card__title">Welcome, {user?.username}</h2>
        <p className="welcome-card__subtitle">{ROLE_MESSAGES.CUSTOMER}</p>
      </section>

      <div className="panel">
        <div className="panel__body panel__body--center">
          <div className="state-block__icon">
            <Icon name="inbox" size={36} />
          </div>
          <h4 className="state-block__title">Your dashboard is ready</h4>
          <p className="state-block__label">
            Service request updates and notifications will appear here once available.
          </p>
        </div>
      </div>
    </div>
  );
}

function TeamDashboard() {
  const { user } = useAuth();
  const workOrders = useFetch("/api/work-orders");
  const notifications = useFetch("/api/notifications");

  const loading = workOrders.loading || notifications.loading;
  const error = workOrders.error || notifications.error;

  if (error) {
    return <ErrorState message={error.message} onRetry={workOrders.reload} />;
  }

  if (loading || workOrders.data === null || notifications.data === null) {
    return <div className="state-block"><Spinner size={32} /></div>;
  }

  const stats = computeStats(workOrders.data);
  const recentWorkOrders = workOrders.data.slice(0, 5);
  const recentNotifications = notifications.data.slice(0, 5);

  return (
    <div className="dashboard">
      <section className="welcome-card">
        <h2 className="welcome-card__title">Welcome, {user?.username}</h2>
        <p className="welcome-card__subtitle">{ROLE_MESSAGES[user?.role]}</p>
      </section>

      <div className="stat-grid">
        <StatCard label="Total Work Orders" value={stats.total} />
        <StatCard label="Open Work Orders" value={stats.open} tone="info" />
        <StatCard label="Completed" value={stats.completed} tone="success" />
        <StatCard
          label="SLA Breached"
          value={stats.withSla > 0 ? `${stats.breached} / ${stats.withSla}` : "—"}
          tone={stats.breached > 0 ? "danger" : undefined}
        />
        <StatCard
          label="Unread Notifications"
          value={notifications.data.filter((n) => !n.read).length}
          tone={notifications.data.some((n) => !n.read) ? "warning" : undefined}
        />
      </div>

      <div className="dashboard__grid">
        <section className="panel">
          <div className="panel__header">
            <h3 className="panel__title">Recent Work Orders</h3>
            <Link className="link" to="/work-orders">
              View all
            </Link>
          </div>
          <div className="panel__body">
            {recentWorkOrders.length === 0 ? (
              <EmptyState title="No work orders yet" />
            ) : (
              <ul className="recent-list">
                {recentWorkOrders.map((wo) => (
                  <li key={wo.id} className="recent-list__item">
                    <div className="recent-list__main">
                      <span className="recent-list__title">
                        #{wo.id} · {wo.title}
                      </span>
                      <span className="recent-list__meta">
                        {wo.customer?.name} · {formatDateTime(wo.createdAt)}
                      </span>
                    </div>
                    <div className="recent-list__side">
                      <StatusBadge status={wo.status} />
                      <SlaBadge status={computeSlaStatus(wo.slaDueAt)} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <h3 className="panel__title">Recent Notifications</h3>
            <Link className="link" to="/notifications">
              View all
            </Link>
          </div>
          <div className="panel__body">
            {recentNotifications.length === 0 ? (
              <EmptyState title="No notifications yet" icon="bell" />
            ) : (
              <ul className="recent-list">
                {recentNotifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`recent-list__item${notification.read ? " recent-list__item--muted" : ""}`}
                  >
                    <div className="recent-list__main">
                      <span className="recent-list__title">{notification.message}</span>
                      <span className="recent-list__meta">{formatDateTime(notification.createdAt)}</span>
                    </div>
                    <NotificationBadge type={notification.type} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  return canUseCustomerApis(user?.role) ? <TeamDashboard /> : <CustomerDashboard />;
}