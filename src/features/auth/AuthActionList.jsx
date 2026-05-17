function AuthActionList({ actions, activeAction, onSelectAction }) {
  return (
    <nav className="auth-action-list" aria-label="API 종류">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          className={activeAction === action.id ? "active" : ""}
          onClick={() => onSelectAction(action.id)}
        >
          <strong>{action.title}</strong>
          <span>
            {action.method} {action.endpoint}
          </span>
        </button>
      ))}
    </nav>
  );
}

export default AuthActionList;
