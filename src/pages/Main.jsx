import { useEffect, useState } from "react";
import CategoryBar from "../components/main/CategoryBar";
import Sidebar from "../components/main/Sidebar";
import BoundaryLayer from "../components/map/BoundaryLayer";
import TerminalLayer from "../components/map/TerminalLayer";
import {
  CATEGORIES,
  FILTER_SECTIONS,
  REGION_CENTERS,
  REGIONS,
} from "../config/appConfig";
import useKakaoMap from "../hooks/useKakaoMap";
import useTerminalData from "../hooks/useTerminalData";
import { navigateTo } from "../routes/Router";
import "../styles/main.css";

const DEFAULT_REGION = "서산";

function Main() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState("terminal");
  const [activeRegion, setActiveRegion] = useState(DEFAULT_REGION);

  const { kakaoMap, mapErrorMessage, mapRef } = useKakaoMap();
  const isTerminalMode = activeCategory === "terminal";
  const selectedSigun = activeRegion || DEFAULT_REGION;
  const { terminals, terminal } = useTerminalData({
    enabled: isTerminalMode,
    sigun: selectedSigun,
  });

  useEffect(() => {
    if (!kakaoMap || !activeRegion) return;

    const center = REGION_CENTERS[activeRegion];
    if (!center) return;

    const latLng = new window.kakao.maps.LatLng(center.lat, center.lng);
    kakaoMap.panTo(latLng);
  }, [kakaoMap, activeRegion]);

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

      <CategoryBar
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      <button type="button" className="auth-link-button" onClick={() => navigateTo("/auth")}>
        API
      </button>

      <Sidebar
        isOpen={isDrawerOpen}
        onToggle={() => setIsDrawerOpen((prev) => !prev)}
        regions={REGIONS}
        activeRegion={activeRegion}
        onSelectRegion={setActiveRegion}
        isTerminalMode={isTerminalMode}
        filterSections={FILTER_SECTIONS}
        terminal={terminal}
      />

      <button type="button" className="count-circle">
        {isTerminalMode ? terminals.length : 45}
      </button>
    </main>
  );
}

export default Main;
