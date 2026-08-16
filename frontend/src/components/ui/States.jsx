export function Spinner({ size = 24 }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-label="Loading" />;
}

export default function LoadingState({ label = "Loading..." }) {
  return (
    <div className="state-block">
      <Spinner size={32} />
      <p className="state-block__label">{label}</p>
    </div>
  );
}