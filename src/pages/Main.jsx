import { useEffect, useRef, useState } from "react";
import "../styles/main.css";

const KAKAO_MAP_KEY = process.env.REACT_APP_KAKAO_MAP_KEY;

function loadKakaoMapScript() {
  return new Promise((resolve, reject) => {
    if (!KAKAO_MAP_KEY) {
      reject(new Error("REACT_APP_KAKAO_MAP_KEY가 설정되어 있지 않습니다."));
      return;
    }

    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(resolve);
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
}

function Main() {
  const mapRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mapInstance = null;
    let isMounted = true;

    const handleResize = () => {
      if (mapInstance) {
        mapInstance.relayout();
      }
    };

    async function initMap() {
      try {
        await loadKakaoMapScript();

        if (!isMounted || !mapRef.current) return;

        const { kakao } = window;

        const center = new kakao.maps.LatLng(36.68, 126.62);

        mapInstance = new kakao.maps.Map(mapRef.current, {
          center,
          level: 9,
        });

        const marker = new kakao.maps.Marker({
          position: center,
        });

        marker.setMap(mapInstance);

        window.addEventListener("resize", handleResize);
      } catch (error) {
        console.error(error);

        if (isMounted) {
          setErrorMessage(
            "지도를 불러오지 못했습니다. 카카오 JavaScript Key와 등록 도메인을 확인해주세요."
          );
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <main className="main-page">
      <section className="main-hero">
        <p className="main-label">충남타임케어</p>

        <h1 className="main-title">생활복지 인프라 분석 지도</h1>

        <p className="main-description">
          서산·당진·홍성·예산의 교통, 안전, 생활편의 인프라 보완 필요도를
          분석하기 위한 지도 영역입니다.
        </p>
      </section>

      <section className="map-section">
        <div className="map-section-header">
          <div>
            <strong className="map-section-title">지도 영역</strong>
            <p className="map-section-description">
              카카오 지도 API 연결 테스트
            </p>
          </div>

          <div className="region-tags">
            <span>서산</span>
            <span>당진</span>
            <span>홍성</span>
            <span>예산</span>
          </div>
        </div>

        {errorMessage ? (
          <div className="map-error">{errorMessage}</div>
        ) : (
          <div ref={mapRef} className="kakao-map-area" />
        )}
      </section>
    </main>
  );
}

export default Main;