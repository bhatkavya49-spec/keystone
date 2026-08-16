import { useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useFetch } from "../api/useFetch";
import { apiFetch } from "../api/client";
import { canDeleteSites, canWriteSites } from "../utils/permissions";
import { formatDateTime } from "../utils/format";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ErrorState from "../components/ui/ErrorState";
import Notice from "../components/ui/Notice";
import Icon from "../components/Icon";

const EMPTY_FORM = {
  siteName: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  customerId: "",
};

function SiteFormModal({ open, site, customers, busy, onSubmit, onClose }) {
  const [form, setForm] = useState(
    site
      ? {
          siteName: site.siteName,
          address: site.address || "",
          city: site.city || "",
          state: site.state || "",
          postalCode: site.postalCode || "",
          customerId: String(site.customer?.id ?? ""),
        }
      : EMPTY_FORM,
  );
  const [error, setError] = useState("");

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await onSubmit({
        siteName: form.siteName,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        postalCode: form.postalCode || null,
        customer: { id: Number(form.customerId) },
      });
      setForm(EMPTY_FORM);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save site");
    }
  };

  return (
    <Modal open={open} title={site ? `Edit Site #${site.id}` : "New Site"} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} noValidate>
        {error && <Notice kind="error">{error}</Notice>}

        <div className="form-group">
          <label className="form-label" htmlFor="site-name">Site Name</label>
          <input
            id="site-name"
            className="form-input"
            type="text"
            value={form.siteName}
            onChange={(e) => setField("siteName", e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="site-customer">Customer</label>
          <select
            id="site-customer"
            className="form-select"
            value={form.customerId}
            onChange={(e) => setField("customerId", e.target.value)}
            required
          >
            <option value="">Select a customer...</option>
            {customers?.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="site-address">Address</label>
            <input
              id="site-address"
              className="form-input"
              type="text"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="site-city">City</label>
            <input
              id="site-city"
              className="form-input"
              type="text"
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="site-state">State</label>
            <input
              id="site-state"
              className="form-input"
              type="text"
              value={form.state}
              onChange={(e) => setField("state", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="site-postal">Postal Code</label>
            <input
              id="site-postal"
              className="form-input"
              type="text"
              value={form.postalCode}
              onChange={(e) => setField("postalCode", e.target.value)}
            />
          </div>
        </div>

        <div className="modal__actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn-primary btn-primary--auto" disabled={busy}>
            {busy ? "Saving..." : site ? "Save Changes" : "Create Site"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function SitesPage() {
  const { user } = useAuth();
  const role = user?.role;

  const { data: sites, loading, error, reload } = useFetch("/api/sites");
  const { data: customers } = useFetch("/api/customers");

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const canWrite = canWriteSites(role);
  const canDelete = canDeleteSites(role);

  const filtered = useMemo(() => {
    if (!sites) return [];
    const query = search.trim().toLowerCase();
    if (!query) return sites;
    return sites.filter(
      (site) =>
        site.siteName?.toLowerCase().includes(query) ||
        site.customer?.name?.toLowerCase().includes(query) ||
        site.city?.toLowerCase().includes(query),
    );
  }, [sites, search]);

  const handleSave = async (payload) => {
    setBusy(true);
    try {
      if (editing) {
        await apiFetch(`/api/sites/${editing.id}`, { method: "PUT", body: payload });
        setNotice(`Site "${editing.siteName}" updated`);
      } else {
        await apiFetch("/api/sites", { method: "POST", body: payload });
        setNotice("Site created");
      }
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await apiFetch(`/api/sites/${deleting.id}`, { method: "DELETE" });
      setNotice(`Site "${deleting.siteName}" deleted`);
      setDeleting(null);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: "id", header: "ID", render: (row) => `#${row.id}` },
    { key: "siteName", header: "Site Name" },
    { key: "customer", header: "Customer", render: (row) => row.customer?.name || "—" },
    { key: "location", header: "Location", render: (row) => [row.city, row.state].filter(Boolean).join(", ") || "—" },
    { key: "address", header: "Address", render: (row) => row.address || "—" },
    { key: "createdAt", header: "Created", render: (row) => formatDateTime(row.createdAt) },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          {canWrite && (
            <button
              type="button"
              className="btn-icon"
              title="Edit site"
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
              title="Delete site"
              onClick={() => setDeleting(row)}
            >
              <Icon name="trash" size={16} />
            </button>
          )}
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
        title="Sites"
        subtitle="Manage customer service locations."
        action={
          canWrite ? (
            <button
              type="button"
              className="btn-primary btn-primary--auto"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Icon name="plus" size={16} />
              <span>New Site</span>
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
            placeholder="Search sites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {!loading && !error && (!customers || customers.length === 0) && canWrite ? (
        <Notice kind="error">
          No customers exist yet. Create a customer before adding sites.
        </Notice>
      ) : null}

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyMessage={search ? "No sites match your search." : "No sites yet. Create your first site."}
      />

      {formOpen && (
        <SiteFormModal
          key={editing?.id ?? "new"}
          open={formOpen}
          site={editing}
          customers={customers}
          busy={busy}
          onSubmit={handleSave}
          onClose={() => setFormOpen(false)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete site"
        message={`Are you sure you want to delete "${deleting?.siteName}"? This action cannot be undone.`}
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}