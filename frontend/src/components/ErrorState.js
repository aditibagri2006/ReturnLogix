function ErrorState({ message = "Something went wrong while loading this data.", onRetry }) {
  return (
    <div className="empty-state error-state">
      <div className="empty-icon">⚠️</div>
      <h3>Couldn't load this</h3>
      <p>{message}</p>
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry}>↻ Retry</button>
      )}
    </div>
  );
}

export default ErrorState;
