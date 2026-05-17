import {
  findAllUsers,
  findServiceKey,
  findUniqueId,
  loginUser,
  signupUser,
  updateServiceKey,
} from "../../services/authApi";

export const initialAuthForms = {
  signup: { userName: "", serviceKey: "" },
  login: { userName: "", uniqueId: "" },
  findKey: { userName: "", uniqueId: "" },
  findCode: { userName: "", serviceKey: "" },
  updateKey: { userName: "", uniqueId: "", serviceKey: "" },
  admin: { adminKey: "" },
};

export const authActions = [
  { id: "signup", title: "회원가입", method: "POST", endpoint: "/api/log/signup" },
  { id: "login", title: "로그인", method: "POST", endpoint: "/api/log/login" },
  { id: "findKey", title: "서비스 키 찾기", method: "POST", endpoint: "/api/log/find-key" },
  { id: "findCode", title: "고유번호 찾기", method: "POST", endpoint: "/api/log/find-code" },
  { id: "updateKey", title: "서비스 키 갱신", method: "PUT", endpoint: "/api/log/update-key" },
  { id: "admin", title: "이용자 목록 조회", method: "POST", endpoint: "/api/log/find-all" },
];

export const authActionMap = {
  signup: signupUser,
  login: loginUser,
  findKey: findServiceKey,
  findCode: findUniqueId,
  updateKey: updateServiceKey,
  admin: findAllUsers,
};

export const authFieldLabels = {
  userName: "사용자명",
  serviceKey: "서비스 키",
  uniqueId: "고유번호",
  adminKey: "관리자 키",
};
