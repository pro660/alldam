import { TERMINAL_API_BASE_URL } from "../config/appConfig";

export const DEFAULT_TERMINAL_AUTH = {
  servicekey: "서비스 키",
  user: "minhyuck",
  code: "1",
  infra: "Terminal",
};

export function createTerminalRequestUrl(sigun, auth = DEFAULT_TERMINAL_AUTH) {
  const params = new URLSearchParams({
    servicekey: auth.servicekey,
    user: auth.user,
    code: auth.code,
    sigun,
    infra: auth.infra,
  });

  return `${TERMINAL_API_BASE_URL}/alldam?${params.toString()}`;
}

export function createTerminalFallbackUrl(sigun) {
  const params = new URLSearchParams({ sigun });
  return `${TERMINAL_API_BASE_URL}/alldam/terminals?${params.toString()}`;
}

export async function fetchTerminalData(sigun, signal) {
  const urls = [createTerminalRequestUrl(sigun), createTerminalFallbackUrl(sigun)];
  let lastError = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, { signal });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      const data = Array.isArray(result?.data) ? result.data : [];

      return {
        data,
        message: result?.message || "터미널 목록 조회 완료",
        requestUrl: url,
      };
    } catch (error) {
      if (error.name === "AbortError") throw error;
      lastError = error;
    }
  }

  throw lastError || new Error("터미널 목록을 불러오지 못했습니다.");
}
