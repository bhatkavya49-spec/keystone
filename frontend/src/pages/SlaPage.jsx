import { useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useFetch } from "../api/useFetch";
import { apiFetch } from "../api/client";
import { canRefreshSla, filterAccessibleWorkOrders } from "../utils/permissions";
import { computeSlaStatus } from "../utils/sla";
import { formatDateTime, titleCase } from "../utils/format";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import ErrorState from "../components/ui/ErrorState";
import Notice from "../components/ui/Notice";
import { StatusBadge, PriorityBadge, SlaBadge } from "../components/ui/Badge";
import Icon from "../components/Icon";

export default function SlaPage() {
  const { user } = useAuth();
  const role = user?.role;

  const { data: workOrders, loading, error, reload } = useFetch("/api/work-orders");
  const [refreshingId, setRefreshingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const canRefresh = canRefreshSla(role);
  const accessibleWorkOrders = useMemo(
    () => filterAccessibleWorkOrders(workOrders, role, user?.username),
    [workOrders, role, user?.username],
  );

  const handleRefresh = async (workOrder) => {
    setRefreshingId(workOrder.id);
    setNotice("");
    setErrorMessage("");
    try {
      const method = canRefresh ? "PATCH" : "GET";
      const response = await apiFetch(`/api/work-orders/${workOrder.id}/sla`, { method });
      setNotice(`Work order #${workOrder.id} SLA refreshed: ${titleCase(response.slaStatus)}`);
      await reload();
    } catch (err) {
      setErrorMessage(err.message || "Failed to refresh SLA status");
    } finally {
      setRefreshingId(null);
    }
  };

  const columns = [
    { key: "id", header: "ID", render: (row) => `#${row.id}` },
    { key: "title", header: "Title" },
    { key: "priority", header: "Priority", render: (row) => <PriorityBadge priority={row.priority} /> },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "slaDueAt", header: "SLA Due", render: (row) => (row.slaDueAt ? formatDateTime(row.slaDueAt) : "—") },
    {
      key: "slaStatus",
      header: "SLA Status",
      render: (row) => <SlaBadge status={computeSlaStatus(row.slaDueAt)} />,
    },
    {
      key: "storedSlaStatus",
      header: "Last Checked",
      render: (row) => (row.slaStatus ? titleCase(row.slaStatus) : "Not evaluated"),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="btn-icon"
            title={canRefresh ? "Refresh and persist SLA status" : "Check SLA status"}
            onClick={() => handleRefresh(row)}
            disabled={refreshingId === row.id}
          >
            <Icon name="refresh" size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (error) {
    return <ErrorState message={error.message} onRetry={reload} />;
  }

  return (
    <div className="page">
      <PageHeader
        title="SLA"
        subtitle="Monitor service level agreement status across work orders."
      />

      {notice && <Notice onClose={() => setNotice("")}>{notice}</Notice>}
      {errorMessage && <Notice kind="error" onClose={() => setErrorMessage("")}>{errorMessage}</Notice>}

      <div className="panel panel--flat">
        <div className="panel__body">
          <p className="state-block__label">
            SLA status is evaluated against each work order's due time.{" "}
            {canRefresh
              ? "Use the refresh action to recompute and persist the status."
              : "The refresh action checks the current status on the server."}
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={accessibleWorkOrders}
        loading={loading}
        emptyMessage="No work orders available for SLA monitoring."
      />
    </div>
  );
}