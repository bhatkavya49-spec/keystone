import { useEffect, useState } from "react";
import { useFetch } from "../../api/useFetch";
import { apiFetch } from "../../api/client";
import DataTable from "../ui/DataTable";
import Modal from "../ui/Modal";
import Notice from "../ui/Notice";
import ErrorState from "../ui/ErrorState";
import Icon from "../Icon";

const STAFF_ROLES = ["TECHNICIAN", "DISPATCHER"];

const INITIAL_FORM = { username: "", email: "", password: "", role: "TECHNICIAN" };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_LABELS = {
  MANAGER: "Manager",
  DISPATCHER: "Dispatcher",
  TECHNICIAN: "Technician",
  CUSTOMER: "Customer",
};

function RequiredMark() {
  return (
    <span className="form-label__required" aria-hidden="true">
      *
    </span>
  );
}

function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="form-field__error" role="alert">
      {children}
    </p>
  );
}

function CreateStaffMemberModal({ open, busy, onSubmit, onClose }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const reset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setError("");
    setSubmitting(false);
    setSuccess(null);
  };

  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.username.trim()) {
      nextErrors.username = "Please enter a username.";
    }
    if (!form.email.trim()) {
      nextErrors.email = "Please enter an email address.";
    } else if (!EMAIL_PATTERN.test(form.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (!form.password) {
      nextErrors.password = "Please enter a password.";
    } else if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }
    if (!form.role) {
      nextErrors.role = "Please choose a role.";
    }
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const created = await onSubmit({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      setSuccess(created);
    } catch (err) {
      setError(err.message || "Failed to create staff member. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitting = busy || submitting;

  return (
    <Modal open={open} title="Create Staff Member" onClose={onClose} size="md">
      {success ? (
        <div className="form-success">
          <div className="form-success__icon">
            <Icon name="checkCircle" size={40} />
          </div>
          <h4 className="form-success__title">Staff member created</h4>
          <p className="form-success__text">
            <strong>{success.username}</strong> was created as a{" "}
            {ROLE_LABELS[success.role]} and can now sign in.
          </p>
          <div className="modal__actions">
            <button type="button" className="btn-primary btn-primary--auto" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {error && <Notice kind="error">{error}</Notice>}

          <div className="form-group">
            <label className="form-label" htmlFor="sm-username">
              Username <RequiredMark />
            </label>
            <input
              id="sm-username"
              className={`form-input${errors.username ? " form-input--invalid" : ""}`}
              type="text"
              placeholder="e.g. jsmith"
              value={form.username}
              onChange={(e) => setField("username", e.target.value)}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? "sm-username-error" : undefined}
              autoFocus
            />
            <FieldError id="sm-username-error">{errors.username}</FieldError>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sm-email">
              Email <RequiredMark />
            </label>
            <input
              id="sm-email"
              className={`form-input${errors.email ? " form-input--invalid" : ""}`}
              type="email"
              placeholder="e.g. jsmith@example.com"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "sm-email-error" : undefined}
            />
            <FieldError id="sm-email-error">{errors.email}</FieldError>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sm-password">
              Password <RequiredMark />
            </label>
            <input
              id="sm-password"
              className={`form-input${errors.password ? " form-input--invalid" : ""}`}
              type="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "sm-password-error" : undefined}
            />
            <FieldError id="sm-password-error">{errors.password}</FieldError>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sm-role">
              Role <RequiredMark />
            </label>
            <select
              id="sm-role"
              className={`form-select${errors.role ? " form-input--invalid" : ""}`}
              value={form.role}
              onChange={(e) => setField("role", e.target.value)}
              aria-invalid={Boolean(errors.role)}
              aria-describedby={errors.role ? "sm-role-error" : undefined}
            >
              {STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
            <FieldError id="sm-role-error">{errors.role}</FieldError>
          </div>

          <p className="form-hint form-hint--required">Fields marked with * are required.</p>

          <div className="modal__actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary btn-primary--auto" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Staff Member"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function TeamManagement() {
  const { data: users, loading, error, reload } = useFetch("/api/auth/users");
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const staff = (users || []).filter((u) => u.role !== "CUSTOMER");

  const handleCreate = async (payload) => {
    setBusy(true);
    try {
      const created = await apiFetch("/api/auth/register", {
        method: "POST",
        body: payload,
      });
      await reload();
      setNotice(`${created.username} created successfully.`);
      return created;
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: "id", header: "ID", render: (row) => `#${row.id}` },
    {
      key: "username",
      header: "Username",
      render: (row) => (
        <span className="table__primary">{row.username}</span>
      ),
    },
    { key: "email", header: "Email", render: (row) => row.email },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <span className="badge badge--info">{ROLE_LABELS[row.role] || row.role}</span>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header__text">
          <h2 className="page-header__title">Team</h2>
          <p className="page-header__subtitle">
            Manage your technicians and dispatchers. Staff accounts can only be created here.
          </p>
        </div>
        <div className="page-header__action">
          <button
            type="button"
            className="btn-primary btn-primary--auto"
            onClick={() => setFormOpen(true)}
          >
            <Icon name="plus" size={16} />
            <span>Create Staff Member</span>
          </button>
        </div>
      </div>

      {notice && <Notice onClose={() => setNotice("")}>{notice}</Notice>}

      <section className="panel">
        <div className="panel__header">
          <h3 className="panel__title">Staff Members</h3>
        </div>
        <div className="panel__body">
          {error ? (
            <ErrorState message={error.message} onRetry={reload} />
          ) : (
            <DataTable
              columns={columns}
              rows={staff}
              loading={loading}
              emptyMessage="No staff members yet. Create your first technician or dispatcher."
            />
          )}
        </div>
      </section>

      <CreateStaffMemberModal
        open={formOpen}
        busy={busy}
        onSubmit={handleCreate}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}
