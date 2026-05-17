import { authFieldLabels } from "./authConfig";

function AuthForm({ form, status, onSubmit, onChangeField }) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      {Object.keys(form).map((field) => {
        const isSecret = field.toLowerCase().includes("key");

        return (
          <label className="auth-field" key={field}>
            <span>{authFieldLabels[field] || field}</span>
            <input
              type={isSecret ? "password" : field === "uniqueId" ? "number" : "text"}
              value={form[field]}
              onChange={(event) => onChangeField(field, event.target.value)}
              autoComplete="off"
              required
            />
          </label>
        );
      })}

      <button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "요청 중" : "요청 보내기"}
      </button>
    </form>
  );
}

export default AuthForm;
