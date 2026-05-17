import { requestJson } from "./apiClient";

export function signupUser({ userName, serviceKey }) {
  return requestJson("/api/log/signup", {
    method: "POST",
    body: { userName, serviceKey },
  });
}

export function loginUser({ userName, uniqueId }) {
  return requestJson("/api/log/login", {
    method: "POST",
    body: { userName, uniqueId: Number(uniqueId) },
  });
}

export function findServiceKey({ userName, uniqueId }) {
  return requestJson("/api/log/find-key", {
    method: "POST",
    body: { userName, uniqueId: Number(uniqueId) },
  });
}

export function findUniqueId({ userName, serviceKey }) {
  return requestJson("/api/log/find-code", {
    method: "POST",
    body: { userName, serviceKey },
  });
}

export function updateServiceKey({ userName, uniqueId, serviceKey }) {
  return requestJson("/api/log/update-key", {
    method: "PUT",
    body: { userName, uniqueId: Number(uniqueId), serviceKey },
  });
}

export function findAllUsers({ adminKey }) {
  return requestJson("/api/log/find-all", {
    method: "POST",
    body: { adminKey },
  });
}
