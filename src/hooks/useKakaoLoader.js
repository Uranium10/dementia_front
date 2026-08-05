import { useState, useEffect } from 'react';

/**
 * 카카오맵 SDK 동적 로더 훅
 * index.html에 전역으로 넣지 않고, 이 훅이 호출된 곳에서만 로딩합니다.
 * StrictMode 이중 마운트 시에도 SDK가 중복 로딩되지 않도록 방어합니다.
 */
export default function useKakaoLoader() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // 1. 카카오맵 객체가 이미 전역에 있고 초기화까지 된 경우 (재렌더링 시)
    if (window.kakao && window.kakao.maps && window.kakao.maps.Map) {
      setLoaded(true);
      return;
    }

    const scriptId = 'kakao-map-script';

    // 2. 이미 문서에 스크립트가 로딩 중이거나 삽입된 상태라면 중복 방지
    if (document.getElementById(scriptId)) {
      // 로딩 중이더라도 kakao.maps.load()가 언젠가 불릴 것을 대비해
      // 직접 이벤트 리스너나 polling을 하기보다, SDK 자체의 load 콜백을 활용합니다.
      // 하지만 가장 안전한 건 전역 콜백 큐를 만드는 것이나, 이 프로젝트의 
      // 단일 맵 구조상 setInterval 폴링이 가장 직관적일 수 있습니다.
      const checkLoaded = setInterval(() => {
        if (window.kakao && window.kakao.maps && window.kakao.maps.Map) {
          clearInterval(checkLoaded);
          setLoaded(true);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    // 3. 스크립트 태그 직접 생성
    const script = document.createElement('script');
    script.id = scriptId;
    // .env.local 에서 관리되는 키값
    const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY;

    if (!KAKAO_KEY) {
      console.error('VITE_KAKAO_MAP_KEY 환경변수가 누락되었습니다.');
      setError(true);
      return;
    }

    // autoload=false : SDK 내부 초기화 후 우리가 지정한 콜백에서 완료를 감지
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services,clusterer&autoload=false`;
    
    script.onload = () => {
      // 스크립트 로드 완료 시점에 카카오맵 내부 초기화를 기다린 후 완료 처리
      window.kakao.maps.load(() => {
        setLoaded(true);
      });
    };

    script.onerror = () => {
      setError(true);
    };

    document.head.appendChild(script);

    // 컴포넌트 unmount 시 스크립트 태그를 삭제하지 않습니다.
    // 한번 로딩된 카카오맵 객체는 남겨두는 편이 다른 라우트 이동 후 돌아왔을 때 부드럽습니다.
  }, []);

  return { loaded, error };
}
