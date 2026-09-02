import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { useFetch } from "../../api/useFetch";
import { apiFetch } from "../../api/client";
import {
  canAssignWorkOrders,
  canCreateWorkOrders,
  canDeleteWorkOrders,
  filterAccessibleWorkOrders,
} from "../../utils/permissions";
import { computeSlaStatus } from "../../utils/sla";
import { formatDateTime } from "../../utils/format";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ErrorState from "../../components/ui/ErrorState";
import Notice from "../../components/ui/Notice";
import { StatusBadge, PriorityBadge, SlaBadge } from "../../components/ui/Badge";
import Icon from "../../components/Icon";
import WorkOrderFormModal from "./WorkOrderFormModal";
import AssignWorkOrderModal from "./AssignWorkOrderModal";
import WorkOrderDetailModal from "./WorkOrderDetailModal";

const STATUS_FILTERS = ["ALL", "NEW", "ASSIGNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED"];

export default function WorkOrdersPage() {
  const { user } = useAuth();
  const role = user?.role;

  const { data: workOrders, loading, error, reload } = useFetch("/api/work-orders");
  const { data: customers } = useFetch("/api/customers");
  const { data: sites } = useFetch("/api/sites");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let cancelled = false;
    if (!viewing) {
      setHistory([]);
      return undefined;
    }
    setHistory([]);
    apiFetch(`/api/work-orders/${viewing.id}/history`)
      .then((entries) => {
        if (!cancelled) setHistory(entries || []);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      });
    return () => {
      cancelled = true;
    };
  }, [viewing]);

  const isTechnician = role === "TECHNICIAN";
  const canCreate = canCreateWorkOrders(role);
  const canAssign = canAssignWorkOrders(role);
  const canDelete = canDeleteWorkOrders(role);

  const isOwn = (wo) => wo.assignedTechnician?.username === user?.username;

  const accessibleWorkOrders = useMemo(
    () => filterAccessibleWorkOrders(workOrders, role, user?.username),
    [workOrders, role, user?.username],
  );

  const filtered = useMemo(() => {
    if (!accessibleWorkOrders) return [];
    const query = search.trim().toLowerCase();
    return accessibleWorkOrders.filter((wo) => {
      const matchesStatus = statusFilter === "ALL" || wo.status === statusFilter;
      const matchesSearch =
        !query ||
        wo.title?.toLowerCase().includes(query) ||
        String(wo.id).includes(query) ||
        wo.customer?.name?.toLowerCase().includes(query) ||
        wo.assignedTechnician?.username?.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [accessibleWorkOrders, search, statusFilter]);

  const handleSave = async (payload) => {
    setBusy(true);
    try {
      if (editing) {
        await apiFetch(`/api/work-orders/${editing.id}`, { method: "PUT", body: payload });
        setNotice(`Work order #${editing.id} updated`);
      } else {
        const created = await apiFetch("/api/work-orders", { method: "POST", body: payload });
        setNotice(`Work order #${created.id} created`);
      }
      await reload();
      setFormOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const handleAssign = async (payload) => {
    setBusy(true);
    try {
      await apiFetch(`/api/work-orders/${assigning.id}/assign`, {
        method: "PATCH",
        body: payload,
      });
      setNotice(`Work order #${assigning.id} assigned`);
      await reload();
      setAssigning(null);
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (workOrder, action, message) => {
    setBusy(true);
    try {
      await apiFetch(`/api/work-orders/${workOrder.id}/${action}`, { method: "PATCH" });
      setNotice(message);
      await reload();
      setViewing((prev) => {
        if (!prev || prev.id !== workOrder.id) return prev;
        let newStatus = prev.status;
        if (action === "start") newStatus = "IN_PROGRESS";
        else if (action === "hold") newStatus = "ON_HOLD";
        else if (action === "resume") newStatus = "IN_PROGRESS";
        else if (action === "complete") newStatus = "COMPLETED";
        return {
          ...prev,
          status: newStatus,
          completedAt:
            action === "complete" ? new Date().toISOString() : prev.completedAt,
        };
      });
    } finally {
      setBusy(false);
    }
  };

  const handleStart = (workOrder) => runAction(workOrder, "start", "Work order started");
  const handleHold = (workOrder) => runAction(workOrder, "hold", "Work order put on hold");
  const handleResume = (workOrder) => runAction(workOrder, "resume", "Work order resumed");
  const handleComplete = (workOrder) => runAction(workOrder, "complete", "Work order completed");

  const handleDelete = async () => {
    setBusy(true);
    try {
      await apiFetch(`/api/work-orders/${deleting.id}`, { method: "DELETE" });
      setNotice(`Work order #${deleting.id} deleted`);
      setDeleting(null);
      setViewing(null);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const rowActionState = (wo) => ({
    canStart: isTechnician && isOwn(wo) && wo.status === "ASSIGNED",
    canHold: isTechnician && isOwn(wo) && wo.status === "IN_PROGRESS",
    canResume: isTechnician && isOwn(wo) && wo.status === "ON_HOLD",
    canComplete: isTechnician && isOwn(wo) && wo.status === "IN_PROGRESS",
  });

  const columns = [
    { key: "id", header: "ID", render: (row) => `#${row.id}` },
    { key: "title", header: "Title", render: (row) => (
        <div>
          <span className="table__primary">{row.title}</span>
          {row.description && <span className="table__secondary">{row.description}</span>}
        </div>
      ) },
    { key: "customer", header: "Customer", render: (row) => row.customer?.name || "—" },
    { key: "technician", header: "Technician", render: (row) => row.assignedTechnician?.username || "Unassigned" },
    { key: "priority", header: "Priority", render: (row) => <PriorityBadge priority={row.priority} /> },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "sla", header: "SLA", render: (row) => <SlaBadge status={computeSlaStatus(row.slaDueAt)} /> },
    { key: "createdAt", header: "Created", render: (row) => formatDateTime(row.createdAt) },
    {
      key: "actions",
      header: "",
      render: (row) => {
        const state = rowActionState(row);
        return (
          <div className="row-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="btn-icon"
              title="View details"
              onClick={() => setViewing(row)}
            >
              <Icon name="eye" size={16} />
            </button>
            {canAssign && (
              <button
                type="button"
                className="btn-icon"
                title="Assign technician"
                onClick={() => setAssigning(row)}
              >
                <Icon name="userPlus" size={16} />
              </button>
            )}
            {state.canStart && (
              <button
                type="button"
                className="btn-icon"
                title="Start work"
                onClick={() => handleStart(row)}
              >
                <Icon name="play" size={16} />
              </button>
            )}
            {state.canHold && (
              <button
                type="button"
                className="btn-icon"
                title="Hold work"
                onClick={() => handleHold(row)}
              >
                <Icon name="pause" size={16} />
              </button>
            )}
            {state.canResume && (
              <button
                type="button"
                className="btn-icon"
                title="Resume work"
                onClick={() => handleResume(row)}
              >
                <Icon name="play" size={16} />
              </button>
            )}
            {state.canComplete && (
              <button
                type="button"
                className="btn-icon btn-icon--success"
                title="Complete work"
                onClick={() => handleComplete(row)}
              >
                <Icon name="check" size={16} />
              </button>
            )}
            {canCreate && (
              <button
                type="button"
                className="btn-icon"
                title="Edit work order"
                onClick={() => {
                  setEditing(row);
                  setFormOpen(true);
                }}
              >
                <Icon name="edit" size={16} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="btn-icon btn-icon--danger"
                title="Delete work order"
                onClick={() => setDeleting(row)}
              >
                <Icon name="trash" size={16} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const viewingActions = rowActionState(viewing || {});

  if (error) {
    return <ErrorState message={error.message} onRetry={reload} />;
  }

  return (
    <div className="page">
      <PageHeader
        title="Work Orders"
        subtitle={
          isTechnician
            ? "View and work on the work orders assigned to you."
            : "Create, assign and track service work orders."
        }
        action={
          canCreate ? (
            <button
              type="button"
              className="btn-primary btn-primary--auto"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Icon name="plus" size={16} />
              <span>New Work Order</span>
            </button>
          ) : undefined
        }
      />

      {notice && <Notice onClose={() => setNotice("")}>{notice}</Notice>}

      <div className="filters">
        <div className="search-box">
          <Icon name="search" size={16} />
          <input
            className="search-box__input"
            type="search"
            placeholder="Search work orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select form-select--inline"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          {STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {status === "ALL" ? "All statuses" : status}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        onRowClick={(row) => setViewing(row)}
        emptyMessage={
          search || statusFilter !== "ALL"
            ? "No work orders match your filters."
            : isTechnician
              ? "You have no assigned work orders yet."
              : "No work orders yet. Create your first work order."
        }
      />

      {formOpen && (
        <WorkOrderFormModal
          key={editing?.id ?? "new"}
          open={formOpen}
          workOrder={editing}
          customers={customers}
          sites={sites}
          busy={busy}
          onSubmit={handleSave}
          onClose={() => setFormOpen(false)}
        />
      )}

      {assigning && (
        <AssignWorkOrderModal
          key={assigning.id}
          open
          workOrder={assigning}
          busy={busy}
          onSubmit={handleAssign}
          onClose={() => setAssigning(null)}
        />
      )}

      <WorkOrderDetailModal
        open={Boolean(viewing)}
        workOrder={viewing}
        history={history}
        canEdit={canCreate}
        canAssign={canAssign}
        canStart={viewingActions.canStart}
        canHold={viewingActions.canHold}
        canResume={viewingActions.canResume}
        canComplete={viewingActions.canComplete}
        canDelete={canDelete}
        canOpenParts={isTechnician}
        canOpenTime={isTechnician}
        busy={busy}
        onEdit={() => {
          setEditing(viewing);
          setViewing(null);
          setFormOpen(true);
        }}
        onAssign={() => {
          setAssigning(viewing);
          setViewing(null);
        }}
        onStart={() => handleStart(viewing)}
        onHold={() => handleHold(viewing)}
        onResume={() => handleResume(viewing)}
        onComplete={() => handleComplete(viewing)}
        onDelete={() => {
          setDeleting(viewing);
          setViewing(null);
        }}
        onClose={() => setViewing(null)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete work order"
        message={`Are you sure you want to delete work order #${deleting?.id}? This action cannot be undone.`}
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}