import { useState } from "react";
import AuthActionList from "../features/auth/AuthActionList";
import AuthForm from "../features/auth/AuthForm";
import AuthResult from "../features/auth/AuthResult";
import {
  authActionMap,
  authActions,
  initialAuthForms,
} from "../features/auth/authConfig";
import { maskAuthResult } from "../features/auth/authSecurity";
import { navigateTo } from "../routes/Router";
import "../styles/auth.css";

function AuthPage() {
  const [forms, setForms] = useState(initialAuthForms);
  const [activeAction, setActiveAction] = useState("signup");
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);

  const currentAction = authActions.find((action) => action.id === activeAction);
  const currentForm = forms[activeAction];

  const updateField = (field, value) => {
    setForms((prev) => ({
      ...prev,
      [activeAction]: {
        ...prev[activeAction],
        [field]: value,
      },
    }));
  };

  const selectAction = (actionId) => {
    setActiveAction(actionId);
    setStatus("idle");
    setResult(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setStatus("loading");
    setResult(null);

    try {
      const payload = await authActionMap[activeAction](currentForm);
      setResult(maskAuthResult(activeAction, payload));
      setStatus("success");
    } catch (error) {
      setResult({
        success: false,
        message: error.message || "API 요청에 실패했습니다.",
        data: null,
      });
      setStatus("error");
    }
  };

  return (
    <main className="auth-page">
      <header className="auth-topbar">
        <div>
          <strong>API 테스트</strong>
          <span>회원/서비스 키 연동 확인</span>
        </div>
        <button type="button" onClick={() => navigateTo("/")}>
          지도로 돌아가기
        </button>
      </header>

      <section className="auth-shell">
        <AuthActionList
          actions={authActions}
          activeAction={activeAction}
          onSelectAction={selectAction}
        />

        <section className="auth-card">
          <div className="auth-card-header">
            <div>
              <strong>{currentAction.title}</strong>
              <span>
                {currentAction.method} {currentAction.endpoint}
              </span>
            </div>
            <span className={`auth-status ${status}`}>{status}</span>
          </div>

          <AuthForm
            form={currentForm}
            status={status}
            onSubmit={handleSubmit}
            onChangeField={updateField}
          />

          <AuthResult result={result} />
        </section>
      </section>
    </main>
  );
}

export default AuthPage;
