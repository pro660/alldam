import { useEffect, useRef } from "react";

function TerminalLayer({ map, terminals }) {
  const markerRefs = useRef([]);

  useEffect(() => {
    if (!map || !window.kakao?.maps) return undefined;

    const kakao = window.kakao;

    markerRefs.current.forEach((marker) => {
      marker.setMap(null);
    });
    markerRefs.current = [];

    if (!Array.isArray(terminals) || terminals.length === 0) {
      return undefined;
    }

    const bounds = new kakao.maps.LatLngBounds();

    terminals.forEach((terminal) => {
      const latitude = Number(terminal.latitude);
      const longitude = Number(terminal.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      const position = new kakao.maps.LatLng(latitude, longitude);
      const marker = new kakao.maps.Marker({
        map,
        position,
        title: terminal.terminalName,
      });

      bounds.extend(position);
      markerRefs.current.push(marker);
    });

    if (markerRefs.current.length === 1) {
      map.setLevel(5);
      map.panTo(markerRefs.current[0].getPosition());
    } else if (markerRefs.current.length > 1) {
      map.setBounds(bounds);
    }

    return () => {
      markerRefs.current.forEach((marker) => {
        marker.setMap(null);
      });
      markerRefs.current = [];
    };
  }, [map, terminals]);

  return null;
}

export default TerminalLayer;
