import { useEffect, useRef } from "react";

const boundaryFileMap = {
  sigungu: "/data/boundaries/sigungu.json",
  eupmyeondong: "/data/boundaries/eupmyeondong.json",
};

const targetRegions = ["서산", "당진", "홍성", "예산"];

function BoundaryLayer({ map }) {
  const polygonRefs = useRef([]);
  const overlayRef = useRef(null);
  const renderKeyRef = useRef("");
  const dataCacheRef = useRef({});
  const pathCacheRef = useRef({});
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!map || !window.kakao || !window.kakao.maps) return;

    const kakao = window.kakao;
    let isAlive = true;

    const clearPolygons = () => {
      polygonRefs.current.forEach((polygon) => {
        polygon.setMap(null);
      });

      polygonRefs.current = [];

      if (overlayRef.current) {
        overlayRef.current.setMap(null);
      }
    };

    const getBoundaryTypeByLevel = (level) => {
      if (level <= 8) return "eupmyeondong";
      if (level <= 10) return "sigungu";
      return "none";
    };

    const fetchBoundaryData = async (boundaryType) => {
      if (dataCacheRef.current[boundaryType]) {
        return dataCacheRef.current[boundaryType];
      }

      const filePath = boundaryFileMap[boundaryType];
      if (!filePath) return null;

      const response = await fetch(filePath);

      if (!response.ok) {
        throw new Error(`경계 데이터를 불러오지 못했습니다: ${filePath}`);
      }

      const geoJson = await response.json();
      dataCacheRef.current[boundaryType] = geoJson;

      return geoJson;
    };

    const escapeHtml = (value) => {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    };

    const getFeatureName = (feature) => {
      const props = feature.properties || {};

      return (
        props.displayName ||
        props.name ||
        props.region ||
        props.SIG_KOR_NM ||
        props.SIGUNGU_NM ||
        props.SGG_NM ||
        props.ADM_NM ||
        props.adm_nm ||
        props.EMD_KOR_NM ||
        props.EMD_NM ||
        "지역명 없음"
      );
    };

    const getFeatureCode = (feature) => {
      const props = feature.properties || {};

      return (
        props.boundaryCode ||
        props.code ||
        props.SIG_CD ||
        props.SIGUNGU_CD ||
        props.SGG_CD ||
        props.ADM_CD ||
        props.adm_cd ||
        props.EMD_CD ||
        props.LAWD_CD ||
        ""
      );
    };

    const isManagedRegion = (feature) => {
      const props = feature.properties || {};
      const name = getFeatureName(feature);

      return targetRegions.some((region) => {
        return (
          props.region === region ||
          name.includes(region) ||
          props.sigunguName?.includes(region) ||
          props.SIG_KOR_NM?.includes(region) ||
          props.SIGUNGU_NM?.includes(region) ||
          props.SGG_NM?.includes(region) ||
          props.ADM_NM?.includes(region) ||
          props.adm_nm?.includes(region)
        );
      });
    };

    const convertRingToKakaoPath = (ring) => {
      return ring.map(([lng, lat]) => new kakao.maps.LatLng(lat, lng));
    };

    const getPathListFromGeometry = (geometry) => {
      if (!geometry) return [];

      if (geometry.type === "Polygon") {
        const outerRing = geometry.coordinates[0];
        return [convertRingToKakaoPath(outerRing)];
      }

      if (geometry.type === "MultiPolygon") {
        return geometry.coordinates.map((polygon) => {
          const outerRing = polygon[0];
          return convertRingToKakaoPath(outerRing);
        });
      }

      return [];
    };

    const prepareBoundaryData = (boundaryType, geoJson) => {
      if (pathCacheRef.current[boundaryType]) {
        return pathCacheRef.current[boundaryType];
      }

      const preparedFeatures = (geoJson?.features || [])
        .filter(isManagedRegion)
        .map((feature) => ({
          code: getFeatureCode(feature),
          name: getFeatureName(feature),
          pathList: getPathListFromGeometry(feature.geometry),
        }))
        .filter((feature) => feature.pathList.length > 0);

      pathCacheRef.current[boundaryType] = preparedFeatures;
      return preparedFeatures;
    };

    const createCustomOverlay = () => {
      if (overlayRef.current) return overlayRef.current;

      overlayRef.current = new kakao.maps.CustomOverlay({
        xAnchor: 0.5,
        yAnchor: 1.2,
      });

      return overlayRef.current;
    };

    const createOverlayContent = (name) => {
      return `
        <div style="
          padding: 0.35rem 0.65rem;
          border-radius: 999rem;
          background: #ffffff;
          color: #6f24b8;
          font-size: 0.78rem;
          font-weight: 800;
          box-shadow: 0 0.35rem 0.9rem rgb(0 0 0 / 14%);
          white-space: nowrap;
        ">
          ${escapeHtml(name)}
        </div>
      `;
    };

    const drawPolygons = (boundaryType, preparedFeatures) => {
      clearPolygons();

      const isDetail = boundaryType === "eupmyeondong";

      const polygonStyle = {
        strokeWeight: isDetail ? 2 : 3,
        strokeColor: isDetail ? "#6f24b8" : "#004c80",
        strokeOpacity: 0.85,
        strokeStyle: "solid",
        fillColor: "#ffffff",
        fillOpacity: isDetail ? 0.1 : 0.16,
        zIndex: isDetail ? 12 : 10,
      };

      preparedFeatures.forEach(({ name, code, pathList }) => {
        pathList.forEach((path) => {
          const polygon = new kakao.maps.Polygon({
            map,
            path,
            ...polygonStyle,
          });

          kakao.maps.event.addListener(polygon, "mouseover", (mouseEvent) => {
            polygon.setOptions({
              fillColor: "#d899f5",
              fillOpacity: 0.35,
            });

            const overlay = createCustomOverlay();
            overlay.setContent(createOverlayContent(name));
            overlay.setPosition(mouseEvent.latLng);
            overlay.setMap(map);
          });

          kakao.maps.event.addListener(polygon, "mousemove", (mouseEvent) => {
            if (!overlayRef.current) return;
            overlayRef.current.setPosition(mouseEvent.latLng);
          });

          kakao.maps.event.addListener(polygon, "mouseout", () => {
            polygon.setOptions({
              fillColor: polygonStyle.fillColor,
              fillOpacity: polygonStyle.fillOpacity,
            });

            if (overlayRef.current) {
              overlayRef.current.setMap(null);
            }
          });

          kakao.maps.event.addListener(polygon, "click", (mouseEvent) => {
            if (boundaryType === "sigungu") {
              map.setLevel(8);
              map.panTo(mouseEvent.latLng);
              return;
            }

            console.log("선택한 읍면동:", {
              name,
              code,
            });
          });

          polygonRefs.current.push(polygon);
        });
      });
    };

    const updateBoundary = async () => {
      const boundaryType = getBoundaryTypeByLevel(map.getLevel());
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (renderKeyRef.current === boundaryType) return;

      renderKeyRef.current = boundaryType;

      if (boundaryType === "none") {
        clearPolygons();
        return;
      }

      try {
        const geoJson = await fetchBoundaryData(boundaryType);

        if (!isAlive || requestIdRef.current !== requestId) return;

        const preparedFeatures = prepareBoundaryData(boundaryType, geoJson);
        drawPolygons(boundaryType, preparedFeatures);
      } catch (error) {
        console.error(error);
        clearPolygons();
      }
    };

    renderKeyRef.current = "";
    updateBoundary();

    kakao.maps.event.addListener(map, "idle", updateBoundary);

    return () => {
      isAlive = false;
      requestIdRef.current += 1;
      kakao.maps.event.removeListener(map, "idle", updateBoundary);
      clearPolygons();
      renderKeyRef.current = "";
    };
  }, [map]);

  return null;
}

export default BoundaryLayer;
