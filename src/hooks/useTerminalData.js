import { useEffect, useMemo, useState } from "react";
import { createTerminalRequestUrl, fetchTerminalData } from "../services/terminalApi";

function useTerminalData({ enabled, sigun }) {
  const [terminals, setTerminals] = useState([]);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [requestUrl, setRequestUrl] = useState(createTerminalRequestUrl(sigun));

  const summary = useMemo(() => {
    if (status === "loading") return "조회 중";
    if (status === "success") return `${terminals.length}개 조회`;
    if (status === "error") return "조회 실패";
    return "조회 대기";
  }, [status, terminals.length]);

  useEffect(() => {
    if (!enabled) {
      setTerminals([]);
      setStatus("idle");
      setMessage("");
      return undefined;
    }

    const controller = new AbortController();
    const nextRequestUrl = createTerminalRequestUrl(sigun);

    setStatus("loading");
    setMessage("");
    setRequestUrl(nextRequestUrl);

    fetchTerminalData(sigun, controller.signal)
      .then((result) => {
        setTerminals(result.data);
        setStatus("success");
        setMessage(result.message);
        setRequestUrl(result.requestUrl);
      })
      .catch((error) => {
        if (error.name === "AbortError") return;

        setTerminals([]);
        setStatus("error");
        setMessage(
          "localhost:8080 터미널 API에 연결할 수 없습니다. 백엔드 서버 실행 여부와 CORS 설정을 확인해주세요."
        );
      });

    return () => {
      controller.abort();
    };
  }, [enabled, sigun]);

  return {
    terminals,
    terminal: {
      selectedSigun: sigun,
      status,
      summary,
      message,
      requestUrl,
      terminals,
    },
  };
}

export default useTerminalData;
