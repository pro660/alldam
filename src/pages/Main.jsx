import { useEffect, useMemo, useRef, useState } from "react";
import BoundaryLayer from "../components/map/BoundaryLayer";
import TerminalLayer from "../components/map/TerminalLayer";
import "../styles/main.css";

const KAKAO_MAP_KEY = process.env.REACT_APP_KAKAO_MAP_KEY;

let kakaoMapSdkPromise = null;

function loadKakaoMapSdk() {
  if (window.kakao?.maps) {
    return new Promise((resolve) => {
      window.kakao.maps.load(resolve);
    });
  }

  if (kakaoMapSdkPromise) return kakaoMapSdkPromise;

  kakaoMapSdkPromise = new Promise((resolve, reject) => {
    if (!KAKAO_MAP_KEY) {
      reject(new Error("REACT_APP_KAKAO_MAP_KEY가 설정되어 있지 않습니다."));
      return;
    }

    const existingScript = document.querySelector("script[data-kakao-map-sdk]");

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        window.kakao.maps.load(resolve);
      });
      existingScript.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.setAttribute("data-kakao-map-sdk", "true");
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false`;
    script.onload = () => {
      window.kakao.maps.load(resolve);
    };
    script.onerror = () => {
      reject(new Error("카카오 지도 SDK를 불러오지 못했습니다."));
    };

    document.head.appendChild(script);
  });

  return kakaoMapSdkPromise;
}

const categories = [
  { id: "terminal", icon: "T", label: "터미널" },
  { id: "food", icon: "F", label: "음식점" },
  { id: "public", icon: "P", label: "공공 기관" },
  { id: "etc", icon: "E", label: "기타 시설" },
];

const regionItems = ["서산", "당진", "홍성", "예산"];

const regionCenters = {
  서산: { lat: 36.6893088, lng: 126.5879975 },
  당진: { lat: 36.8944, lng: 126.6298 },
  홍성: { lat: 36.6011, lng: 126.6608 },
  예산: { lat: 36.6827, lng: 126.8489 },
};

const defaultMapCenter = {
  lat: 36.7599,
  lng: 126.6578,
};

const filterSections = [
  { title: "읍", count: 3 },
  { title: "면", count: 6 },
  { title: "리", count: 3 },
];

const terminalRequestConfig = {
  servicekey: "서비스 키",
  user: "minhyuck",
  code: "1",
  infra: "Terminal",
};

function createTerminalRequestUrl(sigun) {
  const params = new URLSearchParams({
    servicekey: terminalRequestConfig.servicekey,
    user: terminalRequestConfig.user,
    code: terminalRequestConfig.code,
    sigun,
    Infra: terminalRequestConfig.infra,
  });

  return `http://localhost:8080/alldam?${params.toString()}`;
}

function createTerminalFallbackUrl(sigun) {
  const params = new URLSearchParams({ sigun });
  return `http://localhost:8080/alldam/terminals?${params.toString()}`;
}

async function fetchTerminalData(sigun, signal) {
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

function Main() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [kakaoMap, setKakaoMap] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState("terminal");
  const [activeRegion, setActiveRegion] = useState("서산");
  const [mapErrorMessage, setMapErrorMessage] = useState("");
  const [terminals, setTerminals] = useState([]);
  const [terminalStatus, setTerminalStatus] = useState("idle");
  const [terminalMessage, setTerminalMessage] = useState("");
  const [terminalRequestUrl, setTerminalRequestUrl] = useState(
    createTerminalRequestUrl("서산")
  );

  const selectedSigun = activeRegion || "서산";
  const isTerminalMode = activeCategory === "terminal";

  const terminalSummary = useMemo(() => {
    if (terminalStatus === "loading") return "조회 중";
    if (terminalStatus === "success") return `${terminals.length}개 조회`;
    if (terminalStatus === "error") return "조회 실패";
    return "조회 대기";
  }, [terminalStatus, terminals.length]);

  useEffect(() => {
    const container = mapRef.current;

    if (!container) return;

    let isAlive = true;
    setMapErrorMessage("");

    loadKakaoMapSdk()
      .then(() => {
        if (!isAlive || !container) return;

        container.replaceChildren();
        mapInstanceRef.current = null;

        if (typeof window.kakao.maps.disableHD === "function") {
          window.kakao.maps.disableHD();
        }

        const center = new window.kakao.maps.LatLng(
          defaultMapCenter.lat,
          defaultMapCenter.lng
        );

        const map = new window.kakao.maps.Map(container, {
          center,
          level: 8,
          tileAnimation: false,
        });

        map.setDraggable(true);
        map.setZoomable(true);
        map.setMinLevel(3);
        map.setMaxLevel(10);

        mapInstanceRef.current = map;
        setKakaoMap(map);
      })
      .catch((error) => {
        console.error(error);
        if (isAlive) {
          setMapErrorMessage(
            "카카오 지도를 불러오지 못했습니다. 네트워크 연결과 카카오 JavaScript 키의 허용 도메인을 확인해주세요."
          );
        }
      });

    return () => {
      isAlive = false;
      mapInstanceRef.current = null;

      if (container) {
        container.replaceChildren();
      }
    };
  }, []);

  useEffect(() => {
    if (!kakaoMap) return;
    if (!activeRegion) return;

    const center = regionCenters[activeRegion];
    if (!center) return;

    const latLng = new window.kakao.maps.LatLng(center.lat, center.lng);
    kakaoMap.panTo(latLng);
  }, [kakaoMap, activeRegion]);

  useEffect(() => {
    if (!isTerminalMode) {
      setTerminals([]);
      setTerminalStatus("idle");
      setTerminalMessage("");
      return undefined;
    }

    const controller = new AbortController();
    const nextRequestUrl = createTerminalRequestUrl(selectedSigun);

    setTerminalStatus("loading");
    setTerminalMessage("");
    setTerminalRequestUrl(nextRequestUrl);

    fetchTerminalData(selectedSigun, controller.signal)
      .then((result) => {
        setTerminals(result.data);
        setTerminalStatus("success");
        setTerminalMessage(result.message);
        setTerminalRequestUrl(result.requestUrl);
      })
      .catch((error) => {
        if (error.name === "AbortError") return;

        setTerminals([]);
        setTerminalStatus("error");
        setTerminalMessage(
          "localhost:8080 터미널 API에 연결할 수 없습니다. 백엔드 서버 실행 여부와 CORS 설정을 확인해주세요."
        );
      });

    return () => {
      controller.abort();
    };
  }, [isTerminalMode, selectedSigun]);

  return (
    <main className="main-page">
      <section ref={mapRef} className="map-area" aria-label="카카오 지도" />

      {mapErrorMessage ? (
        <section className="map-error-panel" role="alert">
          {mapErrorMessage}
        </section>
      ) : null}

      <BoundaryLayer map={kakaoMap} />
      <TerminalLayer map={kakaoMap} terminals={isTerminalMode ? terminals : []} />

      <section className="category-bar" aria-label="시설 카테고리">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`category-button ${
              activeCategory === category.id ? "active" : ""
            }`}
            onClick={() => setActiveCategory(category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </section>

      <section className={`left-drawer-wrap ${isDrawerOpen ? "open" : "closed"}`}>
        <aside className="left-drawer">
          <div className="drawer-content">
            <header className="drawer-header">
              <div className="profile-circle" />
              <span className="project-name">프로젝트명? or 로고</span>
            </header>

            <div className="search-box">
              <input type="text" aria-label="검색어 입력" />
              <button type="button" aria-label="검색">
                검색
              </button>
              <button type="button" aria-label="현재 위치">
                현재
              </button>
            </div>

            <div className="region-row">
              {regionItems.map((region) => (
                <button
                  key={region}
                  type="button"
                  className={activeRegion === region ? "active" : ""}
                  onClick={() => setActiveRegion(region)}
                >
                  {region}
                </button>
              ))}
            </div>

            {isTerminalMode ? (
              <section className="terminal-panel" aria-label="터미널 API 테스트">
                <div className="terminal-panel-header">
                  <div>
                    <strong>터미널 API</strong>
                    <span>{selectedSigun}</span>
                  </div>
                  <span className={`terminal-status ${terminalStatus}`}>
                    {terminalSummary}
                  </span>
                </div>

                <p className="terminal-message">{terminalMessage || "터미널 목록을 조회합니다."}</p>

                <code className="terminal-url">{terminalRequestUrl}</code>

                <div className="terminal-list">
                  {terminals.map((terminal) => (
                    <article className="terminal-item" key={`${terminal.terminalName}-${terminal.latitude}-${terminal.longitude}`}>
                      <strong>{terminal.terminalName}</strong>
                      <span>{terminal.address}</span>
                      {terminal.phoneNumber ? <span>{terminal.phoneNumber}</span> : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : (
              <div className="filter-list">
                {filterSections.map((section) => (
                  <section className="filter-section" key={section.title}>
                    <div className="filter-title">{section.title}</div>

                    <div className="filter-content">
                      <div className="filter-line" />

                      <div className="filter-chip-grid">
                        {Array.from({ length: section.count }).map((_, index) => (
                          <button
                            key={`${section.title}-${index}`}
                            type="button"
                            className="filter-chip"
                            aria-label={`${section.title} 필터 ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>

          <section className="weather-card">
            <span className="weather-place">00면</span>

            <span className="weather-info">
              <span>16도</span>
              <span className="sun-icon">맑음</span>
            </span>
          </section>
        </aside>

        <button
          type="button"
          className="drawer-toggle-button"
          onClick={() => setIsDrawerOpen((prev) => !prev)}
          aria-label={isDrawerOpen ? "메뉴 닫기" : "메뉴 열기"}
        >
          {isDrawerOpen ? "<" : ">"}
        </button>
      </section>

      <button type="button" className="count-circle">
        {isTerminalMode ? terminals.length : 45}
      </button>
    </main>
  );
}

export default Main;
