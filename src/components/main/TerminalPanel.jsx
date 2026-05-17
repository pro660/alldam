function TerminalPanel({
  selectedSigun,
  status,
  summary,
  message,
  requestUrl,
  terminals,
}) {
  return (
    <section className="terminal-panel" aria-label="터미널 API 테스트">
      <div className="terminal-panel-header">
        <div>
          <strong>터미널 API</strong>
          <span>{selectedSigun}</span>
        </div>
        <span className={`terminal-status ${status}`}>{summary}</span>
      </div>

      <p className="terminal-message">
        {message || "터미널 목록을 조회합니다."}
      </p>

      <code className="terminal-url">{requestUrl}</code>

      <div className="terminal-list">
        {terminals.map((terminal) => (
          <article
            className="terminal-item"
            key={`${terminal.terminalName}-${terminal.latitude}-${terminal.longitude}`}
          >
            <strong>{terminal.terminalName}</strong>
            <span>{terminal.address}</span>
            {terminal.phoneNumber ? <span>{terminal.phoneNumber}</span> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export default TerminalPanel;
