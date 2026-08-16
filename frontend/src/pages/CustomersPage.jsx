import { useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useFetch } from "../api/useFetch";
import { apiFetch } from "../api/client";
import { canDeleteCustomers, canWriteCustomers } from "../utils/permissions";
import { formatDateTime } from "../utils/format";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ErrorState from "../components/ui/ErrorState";
import Notice from "../components/ui/Notice";
import Icon from "../components/Icon";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
};

function CustomerFormModal({ open, customer, busy, onSubmit, onClose }) {
  const [form, setForm] = useState(customer ? { ...EMPTY_FORM, ...customer } : EMPTY_FORM);
  const [error, setError] = useState("");

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await onSubmit({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        postalCode: form.postalCode || null,
      });
      setForm(EMPTY_FORM);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save customer");
    }
  };

  return (
    <Modal
      open={open}
      title={customer ? `Edit Customer #${customer.id}` : "New Customer"}
      onClose={onClose}
      size="md"
    >
      <form onSubmit={handleSubmit} noValidate>
        {error && <Notice kind="error">{error}</Notice>}

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="customer-name">Name</label>
            <input
              id="customer-name"
              className="form-input"
              type="text"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="customer-email">Email</label>
            <input
              id="customer-email"
              className="form-input"
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="customer-phone">Phone</label>
            <input
              id="customer-phone"
              className="form-input"
              type="text"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="customer-address">Address</label>
            <input
              id="customer-address"
              className="form-input"
              type="text"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="customer-city">City</label>
            <input
              id="customer-city"
              className="form-input"
              type="text"
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="customer-state">State</label>
            <input
              id="customer-state"
              className="form-input"
              type="text"
              value={form.state}
              onChange={(e) => setField("state", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="customer-postal">Postal Code</label>
            <input
              id="customer-postal"
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
            {busy ? "Saving..." : customer ? "Save Changes" : "Create Customer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function CustomersPage() {
  const { user } = useAuth();
  const role = user?.role;

  const { data: customers, loading, error, reload } = useFetch("/api/customers");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const canWrite = canWriteCustomers(role);
  const canDelete = canDeleteCustomers(role);

  const filtered = useMemo(() => {
    if (!customers) return [];
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(
      (customer) =>
        customer.name?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.city?.toLowerCase().includes(query),
    );
  }, [customers, search]);

  const handleSave = async (payload) => {
    setBusy(true);
    try {
      if (editing) {
        await apiFetch(`/api/customers/${editing.id}`, { method: "PUT", body: payload });
        setNotice(`Customer "${editing.name}" updated`);
      } else {
        await apiFetch("/api/customers", { method: "POST", body: payload });
        setNotice("Customer created");
      }
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await apiFetch(`/api/customers/${deleting.id}`, { method: "DELETE" });
      setNotice(`Customer "${deleting.name}" deleted`);
      setDeleting(null);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: "id", header: "ID", render: (row) => `#${row.id}` },
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone", render: (row) => row.phone || "—" },
    { key: "location", header: "Location", render: (row) => [row.city, row.state].filter(Boolean).join(", ") || "—" },
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
              title="Edit customer"
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
              title="Delete customer"
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
        title="Customers"
        subtitle="Manage customer accounts and contact information."
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
              <span>New Customer</span>
            </button>
          ) : undefined
        }
      />

      {notice && (
        <Notice onClose={() => setNotice("")}>
          {notice}
        </Notice>
      )}

      <div className="filters">
        <div className="search-box">
          <Icon name="search" size={16} />
          <input
            className="search-box__input"
            type="search"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyMessage={search ? "No customers match your search." : "No customers yet. Create your first customer."}
      />

      {formOpen && (
        <CustomerFormModal
          key={editing?.id ?? "new"}
          open={formOpen}
          customer={editing}
          busy={busy}
          onSubmit={handleSave}
          onClose={() => setFormOpen(false)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete customer"
        message={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}