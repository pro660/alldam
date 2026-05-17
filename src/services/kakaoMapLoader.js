import { KAKAO_MAP_KEY } from "../config/appConfig";

let kakaoMapSdkPromise = null;

export function loadKakaoMapSdk() {
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
