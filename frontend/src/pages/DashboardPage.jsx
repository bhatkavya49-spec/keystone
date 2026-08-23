import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useFetch } from "../api/useFetch";
import { apiFetch } from "../api/client";
import { canUseCustomerApis, filterAccessibleWorkOrders } from "../utils/permissions";
import { computeSlaStatus } from "../utils/sla";
import { formatDateTime } from "../utils/format";
import { StatusBadge, PriorityBadge, SlaBadge, NotificationBadge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/States";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import Notice from "../components/ui/Notice";
import DataTable from "../components/ui/DataTable";
import Icon from "../components/Icon";
import NewServiceRequestModal from "./customer/NewServiceRequestModal";
import CustomerRequestDetailModal from "./customer/CustomerRequestDetailModal";

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

function computeCustomerStats(workOrders, notifications) {
  const total = workOrders.length;
  const open = workOrders.filter((wo) =>
    ["NEW", "ASSIGNED", "IN_PROGRESS"].includes(wo.status),
  ).length;
  const inProgress = workOrders.filter((wo) => wo.status === "IN_PROGRESS").length;
  const completed = workOrders.filter((wo) => wo.status === "COMPLETED").length;
  const unread = (notifications || []).filter((n) => !n.read).length;
  return { total, open, inProgress, completed, unread };
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

function CustomerStatCard({ label, value, icon, tone }) {
  return (
    <div className="stat-card stat-card--customer">
      <div className="stat-card__top">
        <span className={`stat-card__icon${tone ? ` stat-card__icon--${tone}` : ""}`}>
          <Icon name={icon} size={18} />
        </span>
        <span className="stat-card__label">{label}</span>
      </div>
      <span className={`stat-card__value${tone ? ` stat-card__value--${tone}` : ""}`}>
        {value}
      </span>
    </div>
  );
}

const STATUS_META = [
  { status: "NEW", label: "Submitted", tone: "new" },
  { status: "ASSIGNED", label: "Assigned", tone: "assigned" },
  { status: "IN_PROGRESS", label: "In Progress", tone: "inProgress" },
  { status: "COMPLETED", label: "Completed", tone: "completed" },
];

function ServiceStatusSummary({ workOrders }) {
  const total = workOrders.length;
  const completed = workOrders.filter((wo) => wo.status === "COMPLETED").length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="status-summary">
      <div className="status-summary__head">
        <div className="status-summary__text">
          <span className="status-summary__label">Service progress</span>
          <span className="status-summary__hint">
            {completed} of {total} request{total === 1 ? "" : "s"} completed
          </span>
        </div>
        <span className="status-summary__pct">{pct}%</span>
      </div>

      <div
        className="status-summary__bar"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Service progress"
      >
        {STATUS_META.map(({ status, tone }) => {
          const count = workOrders.filter((wo) => wo.status === status).length;
          if (count === 0) return null;
          return (
            <div
              key={status}
              className={`status-summary__segment status-summary__segment--${tone}`}
              style={{ width: `${(count / total) * 100}%` }}
              title={`${status}: ${count}`}
            />
          );
        })}
      </div>

      <div className="status-summary__stats">
        {STATUS_META.map(({ status, label, tone }) => {
          const count = workOrders.filter((wo) => wo.status === status).length;
          return (
            <div key={status} className="status-summary__stat">
              <span className={`status-summary__dot status-summary__dot--${tone}`} />
              <span className="status-summary__stat-label">{label}</span>
              <span className="status-summary__count">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CustomerNotifications({ notifications, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="panel__body panel__body--center">
        <Spinner size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel__body">
        <ErrorState message={error.message} onRetry={onRetry} />
      </div>
    );
  }

  const recent = (notifications || []).slice(0, 5);

  if (recent.length === 0) {
    return (
      <div className="panel__body">
        <EmptyState title="No notifications yet" icon="bell" />
      </div>
    );
  }

  return (
    <div className="panel__body">
      <ul className="recent-list">
        {recent.map((notification) => (
          <li
            key={notification.id}
            className={`recent-list__item${notification.read ? " recent-list__item--muted" : ""}`}
          >
            <div className="recent-list__main">
              <span className="recent-list__title">{notification.message}</span>
              <span className="recent-list__meta">{formatDateTime(notification.createdAt)}</span>
            </div>
            <div className="recent-list__side">
              <NotificationBadge type={notification.type} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CustomerDashboard() {
  const { user } = useAuth();
  const me = useFetch("/api/auth/me");
  const customerId = me.data?.customerId;

  const workOrders = useFetch(
    customerId ? `/api/work-orders/customer/${customerId}` : null,
    { enabled: Boolean(customerId) },
  );
  const sites = useFetch(
    customerId ? `/api/sites/customer/${customerId}` : null,
    { enabled: Boolean(customerId) },
  );
  const notifications = useFetch("/api/notifications");

  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const requests = useMemo(() => {
    const list = workOrders.data || [];
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [workOrders.data]);

  const activeWorkOrders = useMemo(
    () => requests.filter((wo) => wo.status !== "NEW"),
    [requests],
  );

  const stats = computeCustomerStats(requests, notifications.data);

  const handleCreateRequest = async (payload) => {
    setBusy(true);
    try {
      const created = await apiFetch("/api/work-orders", { method: "POST", body: payload });
      setNotice(`Service request #${created.id} submitted successfully.`);
      await Promise.all([workOrders.reload(), notifications.reload()]);
      return created;
    } finally {
      setBusy(false);
    }
  };

  if (me.loading || (me.data === null && !me.error)) {
    return <div className="state-block"><Spinner size={32} /></div>;
  }

  if (me.error) {
    return <ErrorState message={me.error.message} onRetry={me.reload} />;
  }

  if (!me.data.customerId) {
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
            <h4 className="state-block__title">No customer profile linked</h4>
            <p className="state-block__label">
              An administrator needs to link a customer profile to your account before you can
              submit and track service requests.
            </p>
          </div>
        </div>

        <section className="panel">
          <div className="panel__header">
            <h3 className="panel__title">Notifications</h3>
            <Link className="link" to="/notifications">View all</Link>
          </div>
          <CustomerNotifications
            notifications={notifications.data}
            loading={notifications.loading}
            error={notifications.error}
            onRetry={notifications.reload}
          />
        </section>
      </div>
    );
  }

  if (workOrders.error || sites.error) {
    const failed = workOrders.error || sites.error;
    const retry = workOrders.error ? workOrders.reload : sites.reload;
    return <ErrorState message={failed.message} onRetry={retry} />;
  }

  if (workOrders.loading || sites.loading || notifications.loading) {
    return <div className="state-block"><Spinner size={32} /></div>;
  }

  const chevronColumn = {
    key: "chevron",
    header: "",
    render: () => (
      <span className="table__chevron">
        <Icon name="chevronRight" size={16} />
      </span>
    ),
  };

  const requestColumns = [
    { key: "id", header: "ID", render: (row) => <span className="table__id">#{row.id}</span> },
    {
      key: "title",
      header: "Request",
      render: (row) => (
        <div>
          <span className="table__primary">{row.title}</span>
          {row.description && <span className="table__secondary">{row.description}</span>}
        </div>
      ),
    },
    { key: "site", header: "Site", render: (row) => row.site?.siteName || "—" },
    {
      key: "priority",
      header: "Priority",
      render: (row) => <PriorityBadge priority={row.priority} dot />,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} dot />,
    },
    {
      key: "createdAt",
      header: "Date",
      render: (row) => <span className="table__date">{formatDateTime(row.createdAt)}</span>,
    },
    chevronColumn,
  ];

  const workOrderColumns = [
    { key: "id", header: "ID", render: (row) => <span className="table__id">#{row.id}</span> },
    {
      key: "title",
      header: "Service / Request",
      render: (row) => (
        <div>
          <span className="table__primary">{row.title}</span>
          {row.site && <span className="table__secondary">{row.site.siteName}</span>}
        </div>
      ),
    },
    {
      key: "assignedTechnician",
      header: "Assigned Worker",
      render: (row) => row.assignedTechnician?.username || "Unassigned",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} dot />,
    },
    {
      key: "date",
      header: "Date",
      render: (row) => <span className="table__date">{formatDateTime(row.scheduledAt || row.createdAt)}</span>,
    },
    chevronColumn,
  ];

  return (
    <div className="dashboard">
      <section className="welcome-card welcome-card--split">
        <div className="welcome-card__text">
          <h2 className="welcome-card__title">Welcome back, {user?.username}</h2>
          <p className="welcome-card__subtitle">
            Track your service requests at {me.data.customerName || "your account"}. New requests
            are reviewed and scheduled by our team.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary btn-primary--auto welcome-card__action"
          onClick={() => setFormOpen(true)}
        >
          <Icon name="plus" size={16} />
          <span>New Service Request</span>
        </button>
      </section>

      {notice && <Notice onClose={() => setNotice("")}>{notice}</Notice>}

      <div className="stat-grid">
        <CustomerStatCard label="Total Requests" value={stats.total} icon="inbox" />
        <CustomerStatCard label="Open" value={stats.open} icon="workOrders" tone="info" />
        <CustomerStatCard label="In Progress" value={stats.inProgress} icon="play" tone="warning" />
        <CustomerStatCard label="Completed" value={stats.completed} icon="check" tone="success" />
        <CustomerStatCard
          label="Unread Notifications"
          value={stats.unread}
          icon="notifications"
          tone={stats.unread > 0 ? "warning" : undefined}
        />
      </div>

      <section className="panel">
        <div className="panel__header">
          <h3 className="panel__title">Service Status</h3>
        </div>
        <div className="panel__body">
          {requests.length === 0 ? (
            <EmptyState title="No requests yet" message="Submit your first service request to get started." />
          ) : (
            <ServiceStatusSummary workOrders={requests} />
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h3 className="panel__title">My Service Requests</h3>
          <button
            type="button"
            className="btn-primary btn-primary--auto"
            onClick={() => setFormOpen(true)}
          >
            <Icon name="plus" size={16} />
            <span>New Request</span>
          </button>
        </div>
        <div className="panel__body">
          <DataTable
            columns={requestColumns}
            rows={requests}
            onRowClick={(row) => setViewing(row)}
            emptyMessage="No service requests yet. Submit your first request."
          />
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h3 className="panel__title">My Work Orders</h3>
        </div>
        <div className="panel__body">
          <DataTable
            columns={workOrderColumns}
            rows={activeWorkOrders}
            onRowClick={(row) => setViewing(row)}
            emptyMessage="No work orders have been scheduled for you yet."
          />
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h3 className="panel__title">Notifications</h3>
          <Link className="link" to="/notifications">View all</Link>
        </div>
        <CustomerNotifications
          notifications={notifications.data}
          loading={notifications.loading}
          error={notifications.error}
          onRetry={notifications.reload}
        />
      </section>

      <NewServiceRequestModal
        open={formOpen}
        customerId={customerId}
        sites={sites.data}
        busy={busy}
        onSubmit={handleCreateRequest}
        onClose={() => setFormOpen(false)}
      />

      <CustomerRequestDetailModal
        open={Boolean(viewing)}
        workOrder={viewing}
        onClose={() => setViewing(null)}
      />
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

  const accessibleWorkOrders = filterAccessibleWorkOrders(
    workOrders.data,
    user?.role,
    user?.username,
  );
  const stats = computeStats(accessibleWorkOrders);
  const recentWorkOrders = accessibleWorkOrders.slice(0, 5);
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