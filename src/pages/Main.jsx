import { useEffect, useRef, useState } from "react";
import BoundaryLayer from "../components/map/BoundaryLayer";
import "../styles/main.css";

const categories = [
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

function Main() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [kakaoMap, setKakaoMap] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState("food");
  const [activeRegion, setActiveRegion] = useState("");

  useEffect(() => {
    const container = mapRef.current;

    if (!container) return;
    if (!window.kakao || !window.kakao.maps) return;

    let isAlive = true;

    window.kakao.maps.load(() => {
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

  return (
    <main className="main-page">
      <section ref={mapRef} className="map-area" aria-label="카카오 지도" />

      <BoundaryLayer map={kakaoMap} />

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
        45
      </button>
    </main>
  );
}

export default Main;
