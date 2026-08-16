export default function WorkOrderSelector({ workOrders, selectedId, onSelect, disabled = false }) {
  return (
    <select
      className="form-select form-select--inline"
      value={selectedId || ""}
      onChange={(event) => onSelect(event.target.value ? Number(event.target.value) : null)}
      disabled={disabled}
      aria-label="Select a work order"
    >
      <option value="">Select a work order...</option>
      {workOrders.map((wo) => (
        <option key={wo.id} value={wo.id}>
          #{wo.id} · {wo.title}
        </option>
      ))}
    </select>
  );
}