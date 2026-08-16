import Icon from "../Icon";

export default function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="state-block state-block--error">
      <div className="state-block__icon">
        <Icon name="alert" size={36} />
      </div>
      <h4 className="state-block__title">Something went wrong</h4>
      <p className="state-block__label">{message}</p>
      {onRetry && (
        <button type="button" className="btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}