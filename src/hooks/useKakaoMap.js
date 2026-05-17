import { useEffect, useRef, useState } from "react";
import { DEFAULT_MAP_CENTER } from "../config/appConfig";
import { loadKakaoMapSdk } from "../services/kakaoMapLoader";

function useKakaoMap() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [kakaoMap, setKakaoMap] = useState(null);
  const [mapErrorMessage, setMapErrorMessage] = useState("");

  useEffect(() => {
    const container = mapRef.current;

    if (!container) return undefined;

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
          DEFAULT_MAP_CENTER.lat,
          DEFAULT_MAP_CENTER.lng
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

  return {
    kakaoMap,
    mapErrorMessage,
    mapRef,
  };
}

export default useKakaoMap;
