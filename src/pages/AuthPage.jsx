import { useMemo, useState } from "react";
import { navigateTo } from "../routes/Router";
import {
  findAllUsers,
  findServiceKey,
  findUniqueId,
  loginUser,
  signupUser,
  updateServiceKey,
} from "../services/authApi";
import "../styles/main.css";

const initialForms = {
  signup: { userName: "", serviceKey: "" },
  login: { userName: "", uniqueId: "" },
  findKey: { userName: "", uniqueId: "" },
  findCode: { userName: "", serviceKey: "" },
  updateKey: { userName: "", uniqueId: "", serviceKey: "" },
  admin: { adminKey: "" },
};

const actionMap = {
  signup: signupUser,
  login: loginUser,
  findKey: findServiceKey,
  findCode: findUniqueId,
  updateKey: updateServiceKey,
  admin: findAllUsers,
};

function maskSecret(value) {
  if (!value) return "";
  if (value.length <= 4) return "*".repeat(value.length);
  return `${value.slice(0, 2)}${"*".repeat(Math.max(value.length - 4, 3))}${value.slice(-2)}`;
}

function maskResult(actionId, payload) {
  if (actionId === "findKey" && typeof payload?.data === "string") {
    return { ...payload, data: maskSecret(payload.data) };
  }

  if (actionId === "admin" && Array.isArray(payload?.data)) {
    return {
      ...payload,
      data: payload.data.map((user) => ({
        ...user,
        serviceKey: maskSecret(user.serviceKey),
      })),
    };
  }

  return payload;
}

function AuthPage() {
  const [forms, setForms] = useState(initialForms);
  const [activeAction, setActiveAction] = useState("signup");
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);

  const actions = useMemo(
    () => [
      { id: "signup", title: "회원가입", method: "POST", endpoint: "/api/log/signup" },
      { id: "login", title: "로그인", method: "POST", endpoint: "/api/log/login" },
      { id: "findKey", title: "서비스 키 찾기", method: "POST", endpoint: "/api/log/find-key" },
      { id: "findCode", title: "고유번호 찾기", method: "POST", endpoint: "/api/log/find-code" },
      { id: "updateKey", title: "서비스 키 갱신", method: "PUT", endpoint: "/api/log/update-key" },
      { id: "admin", title: "이용자 목록 조회", method: "POST", endpoint: "/api/log/find-all" },
    ],
    []
  );

  const currentAction = actions.find((action) => action.id === activeAction);
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    setStatus("loading");
    setResult(null);

    try {
      const payload = await actionMap[activeAction](currentForm);
      setResult(maskResult(activeAction, payload));
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

  const renderFields = () => {
    const fields = Object.keys(currentForm);

    return fields.map((field) => {
      const isSecret = field.toLowerCase().includes("key");
      const labelMap = {
        userName: "사용자명",
        serviceKey: "서비스 키",
        uniqueId: "고유번호",
        adminKey: "관리자 키",
      };

      return (
        <label className="auth-field" key={field}>
          <span>{labelMap[field] || field}</span>
          <input
            type={isSecret ? "password" : field === "uniqueId" ? "number" : "text"}
            value={currentForm[field]}
            onChange={(event) => updateField(field, event.target.value)}
            autoComplete="off"
            required
          />
        </label>
      );
    });
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
        <nav className="auth-action-list" aria-label="API 종류">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className={activeAction === action.id ? "active" : ""}
              onClick={() => {
                setActiveAction(action.id);
                setStatus("idle");
                setResult(null);
              }}
            >
              <strong>{action.title}</strong>
              <span>{action.method} {action.endpoint}</span>
            </button>
          ))}
        </nav>

        <section className="auth-card">
          <div className="auth-card-header">
            <div>
              <strong>{currentAction.title}</strong>
              <span>{currentAction.method} {currentAction.endpoint}</span>
            </div>
            <span className={`auth-status ${status}`}>{status}</span>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {renderFields()}
            <button type="submit" disabled={status === "loading"}>
              {status === "loading" ? "요청 중" : "요청 보내기"}
            </button>
          </form>

          <section className="auth-result" aria-label="API 응답">
            <strong>응답</strong>
            <pre>{result ? JSON.stringify(result, null, 2) : "아직 요청 전입니다."}</pre>
          </section>
        </section>
      </section>
    </main>
  );
}

export default AuthPage;
