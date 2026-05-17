export function maskSecret(value) {
  if (!value) return "";
  if (value.length <= 4) return "*".repeat(value.length);

  return `${value.slice(0, 2)}${"*".repeat(Math.max(value.length - 4, 3))}${value.slice(-2)}`;
}

export function maskAuthResult(actionId, payload) {
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
