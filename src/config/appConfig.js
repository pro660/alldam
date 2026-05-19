export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";
export const TERMINAL_API_BASE_URL =
  process.env.REACT_APP_TERMINAL_API_BASE_URL || API_BASE_URL;

export const KAKAO_MAP_KEY = process.env.REACT_APP_KAKAO_MAP_KEY;

export const REGIONS = ["서산", "당진", "홍성", "예산"];

export const REGION_CENTERS = {
  서산: { lat: 36.6893088, lng: 126.5879975 },
  당진: { lat: 36.8944, lng: 126.6298 },
  홍성: { lat: 36.6011, lng: 126.6608 },
  예산: { lat: 36.6827, lng: 126.8489 },
};

export const DEFAULT_MAP_CENTER = {
  lat: 36.7599,
  lng: 126.6578,
};

export const CATEGORIES = [
  { id: "terminal", icon: "T", label: "터미널" },
  { id: "food", icon: "F", label: "음식점" },
  { id: "public", icon: "P", label: "공공 기관" },
  { id: "etc", icon: "E", label: "기타 시설" },
];

export const FILTER_SECTIONS = [
  { title: "읍", count: 3 },
  { title: "면", count: 6 },
  { title: "리", count: 3 },
];
