import React, { useState, useEffect, useMemo, useCallback } from 'react';
import useKakaoLoader from '../hooks/useKakaoLoader';
import { haversineKm } from '../utils/geo';
import CenterMap from '../components/centerSearch/CenterMap';
import CenterSearchPanel from '../components/centerSearch/CenterSearchPanel';

export default function CenterSearchPage() {
  const { loaded, error: sdkError } = useKakaoLoader();
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  
  const [data, setData] = useState({ centers: [], tagLabels: {} });
  
  // 상태 목록
  const [searchOrigin, setSearchOrigin] = useState(null); // { lat, lng, label }
  const [radiusKm, setRadiusKm] = useState(10);
  const [activeTags, setActiveTags] = useState(new Set());
  const [selectedCenterId, setSelectedCenterId] = useState(null);

  // 1. JSON 데이터 로드
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const res = await fetch('/data/centers.json');
        if (!res.ok) throw new Error('Data fetch failed');
        const json = await res.json();
        setData(json);
        setStatus('ready');
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };
    fetchCenters();
  }, []);

  // 2. Geocoder 등 검색 유틸리티 (메모이제이션 불필요. 매번 사용할 때 호출)
  const searchAddress = useCallback((addrStr) => {
    // 카카오 SDK가 로드되지 않은 상태(sdkError)에서도 다음 우편번호 팝업은 열리므로,
    // 좌표 변환 단계에서 안내 없이 조용히 실패하지 않도록 사용자에게 알려준다.
    if (!window.kakao || !window.kakao.maps) {
      alert('지도 서비스를 사용할 수 없어 주소를 좌표로 변환할 수 없습니다. 아래 지역 선택으로 검색해주세요.');
      return;
    }
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(addrStr, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const { x, y } = result[0]; // x = lng, y = lat
        setSearchOrigin({ lat: parseFloat(y), lng: parseFloat(x), label: addrStr });
        setSelectedCenterId(null);
      } else {
        alert("주소를 찾지 못했습니다. 다시 검색해주세요.");
      }
    });
  }, []);

  const searchCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("브라우저가 위치 정보를 지원하지 않습니다. 주소로 검색해주세요.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSearchOrigin({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: '현재 위치'
        });
        setSelectedCenterId(null);
      },
      (err) => {
        alert("위치 권한이 거부되었거나 가져올 수 없습니다. 주소로 검색해주세요.");
      }
    );
  }, []);

  // 시/군/구 센터 좌표의 평균을 origin으로 사용
  const searchRegion = useCallback((sido, sigungu) => {
    const regionCenters = data.centers.filter(c => c.sido === sido && c.sigungu === sigungu);
    if (regionCenters.length > 0) {
      const avgLat = regionCenters.reduce((sum, c) => sum + c.lat, 0) / regionCenters.length;
      const avgLng = regionCenters.reduce((sum, c) => sum + c.lng, 0) / regionCenters.length;
      setSearchOrigin({ lat: avgLat, lng: avgLng, label: `${sido} ${sigungu}` });
      setSelectedCenterId(null);
    }
  }, [data.centers]);

  // 3. 파생 상태: 거리 계산 및 필터링 (useMemo)
  // 반경 내 결과가 0건이라 전역 최근접 1곳으로 대체한 경우, isRadiusFallback으로 표시해
  // 패널이 "반경 밖입니다" 안내를 별도로 그릴 수 있게 한다.
  const { list: nearbyCenters, isFallback: isRadiusFallback } = useMemo(() => {
    let result = data.centers;

    // 3-1. 태그 필터 (체크된 태그를 하나라도 가지면 통과 = OR 조건)
    if (activeTags.size > 0) {
      result = result.filter(c => {
        if (!c.tags || c.tags.length === 0) return false;
        return c.tags.some(tag => activeTags.has(tag));
      });
    }

    // 3-2. 거리 계산 및 정렬
    if (searchOrigin) {
      const withDistance = result.map(c => ({
        ...c,
        distanceKm: haversineKm(searchOrigin.lat, searchOrigin.lng, c.lat, c.lng)
      }));

      const withinRadius = withDistance.filter(c => c.distanceKm <= radiusKm);
      withinRadius.sort((a, b) => a.distanceKm - b.distanceKm);

      // 반경 내 결과가 0개면(=태그 필터로 전멸한 게 아니라면) 가장 가까운 1개를 반환
      if (withinRadius.length === 0 && withDistance.length > 0) {
        withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
        return { list: [withDistance[0]], isFallback: true };
      }
      return { list: withinRadius, isFallback: false };
    }
    return { list: result, isFallback: false }; // 초기 검색 전에는 전체(클러스터용) 혹은 필터된 전체 반환
  }, [data.centers, searchOrigin, radiusKm, activeTags]);

  const toggleTag = useCallback((tag) => {
    setActiveTags(prev => {
      const newTags = new Set(prev);
      if (newTags.has(tag)) newTags.delete(tag);
      else newTags.add(tag);
      return newTags;
    });
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-5rem)] overflow-hidden font-sans bg-slate-50">
      {status === 'loading' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-bold">센터 정보를 불러오는 중입니다...</p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50">
          <p className="text-red-500 font-bold mb-4">센터 정보를 불러오지 못했습니다.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-200 rounded-lg text-sm font-bold">새로고침</button>
        </div>
      )}

      {/*
        status === 'ready' 이후부터는 지도(SDK)와 좌측 패널(centers.json)을 별개로 취급한다.
        지도 SDK가 실패해도 패널은 항상 렌더링해 목록 검색이 계속 동작하게 한다
        (지도 없이도 검색·필터·리스트는 JSON만으로 완전히 동작한다).
      */}
      {status === 'ready' && (
        <>
          {loaded ? (
            <CenterMap
              centers={nearbyCenters}
              searchOrigin={searchOrigin}
              radiusKm={radiusKm}
              selectedCenterId={selectedCenterId}
              onSelectCenter={setSelectedCenterId}
            />
          ) : sdkError ? (
            <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-slate-100 px-6 text-center">
              <p className="text-slate-700 font-bold mb-2">지도를 불러오지 못했습니다.</p>
              <p className="text-sm text-slate-500 mb-5">
                지도 없이도 아래 목록에서 센터를 검색·확인할 수 있습니다.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors"
              >
                지도 다시 시도
              </button>
            </div>
          ) : (
            <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-slate-100">
              <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-500 rounded-full animate-spin mb-2"></div>
              <p className="text-slate-500 text-sm font-medium">지도 로딩 중...</p>
            </div>
          )}

          <CenterSearchPanel
            allCenters={data.centers}
            filteredCenters={nearbyCenters}
            isRadiusFallback={isRadiusFallback}
            searchOrigin={searchOrigin}
            radiusKm={radiusKm}
            activeTags={activeTags}
            tagLabels={data.tagLabels}
            onSearchAddress={searchAddress}
            onSearchCurrentLocation={searchCurrentLocation}
            onSearchRegion={searchRegion}
            onChangeRadius={setRadiusKm}
            onToggleTag={toggleTag}
            selectedCenterId={selectedCenterId}
            onSelectCenter={(c) => setSelectedCenterId(c.id)}
          />
        </>
      )}
    </div>
  );
}
