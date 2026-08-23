import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import Notice from "../../components/ui/Notice";
import Icon from "../../components/Icon";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const INITIAL_FORM = { title: "", description: "", siteId: "", priority: "" };

const MAX_TITLE = 200;
const MAX_DESCRIPTION = 2000;

function validate(form) {
  const errors = {};
  if (!form.title.trim()) {
    errors.title = "Please enter a title for your request.";
  } else if (form.title.trim().length > MAX_TITLE) {
    errors.title = `Title must be ${MAX_TITLE} characters or fewer.`;
  }
  if (!form.priority) {
    errors.priority = "Please choose a priority.";
  }
  if (form.description.trim().length > MAX_DESCRIPTION) {
    errors.description = `Details must be ${MAX_DESCRIPTION} characters or fewer.`;
  }
  return errors;
}

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

export default function NewServiceRequestModal({
  open,
  customerId,
  sites,
  busy,
  onSubmit,
  onClose,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(INITIAL_FORM);
      setErrors({});
      setError("");
      setSubmitting(false);
      setSuccess(null);
    }
  }, [open]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const created = await onSubmit({
        title: form.title.trim(),
        description: form.description.trim() || null,
        customer: { id: customerId },
        site: form.siteId ? { id: Number(form.siteId) } : null,
        priority: form.priority,
      });
      setSuccess(created);
    } catch (err) {
      setError(err.message || "Failed to submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitting = busy || submitting;

  return (
    <Modal open={open} title="New Service Request" onClose={onClose} size="md">
      {success ? (
        <div className="form-success">
          <div className="form-success__icon">
            <Icon name="checkCircle" size={40} />
          </div>
          <h4 className="form-success__title">Request submitted</h4>
          <p className="form-success__text">
            Service request <strong>#{success.id}</strong> has been received. Our team will review
            it and schedule service at the selected site.
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
            <label className="form-label" htmlFor="sr-title">
              Request title <RequiredMark />
            </label>
            <input
              id="sr-title"
              className={`form-input${errors.title ? " form-input--invalid" : ""}`}
              type="text"
              placeholder="e.g. HVAC not cooling"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "sr-title-error" : undefined}
              autoFocus
            />
            <FieldError id="sr-title-error">{errors.title}</FieldError>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sr-description">
              Details
              <span className="form-hint form-hint--inline">Optional</span>
            </label>
            <textarea
              id="sr-description"
              className={`form-input form-input--textarea${errors.description ? " form-input--invalid" : ""}`}
              rows="4"
              placeholder="Describe the issue and any relevant details..."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? "sr-description-error" : undefined}
            />
            <div className="form-field__meta">
              <FieldError id="sr-description-error">{errors.description}</FieldError>
              <span className="form-hint form-hint--right">
                {form.description.length}/{MAX_DESCRIPTION}
              </span>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="sr-site">
                Site
                <span className="form-hint form-hint--inline">Optional</span>
              </label>
              <select
                id="sr-site"
                className="form-select"
                value={form.siteId}
                onChange={(e) => setField("siteId", e.target.value)}
              >
                <option value="">Select a site...</option>
                {(sites || []).map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.siteName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sr-priority">
                Priority <RequiredMark />
              </label>
              <select
                id="sr-priority"
                className={`form-select${errors.priority ? " form-input--invalid" : ""}`}
                value={form.priority}
                onChange={(e) => setField("priority", e.target.value)}
                aria-invalid={Boolean(errors.priority)}
                aria-describedby={errors.priority ? "sr-priority-error" : undefined}
              >
                <option value="">Select a priority...</option>
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              <FieldError id="sr-priority-error">{errors.priority}</FieldError>
            </div>
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
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}