import Icon from "../Icon";

export default function EmptyState({ title = "No records found", message, icon = "inbox" }) {
  return (
    <div className="state-block">
      <div className="state-block__icon">
        <Icon name={icon} size={36} />
      </div>
      <h4 className="state-block__title">{title}</h4>
      {message && <p className="state-block__label">{message}</p>}
    </div>
  );
}