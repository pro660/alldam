function AuthResult({ result }) {
  return (
    <section className="auth-result" aria-label="API 응답">
      <strong>응답</strong>
      <pre>{result ? JSON.stringify(result, null, 2) : "아직 요청 전입니다."}</pre>
    </section>
  );
}

export default AuthResult;
