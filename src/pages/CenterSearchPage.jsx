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
    if (!window.kakao || !window.kakao.maps) return;
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
  const nearbyCenters = useMemo(() => {
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

      // 반경 내 결과가 0개면 가장 가까운 1개를 반환
      if (withinRadius.length === 0 && withDistance.length > 0) {
        withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
        const closest = withDistance[0];
        // alert은 부작용이므로 조심스럽게 사용 (여기서는 렌더링 중이므로 안됨, 패널에서 처리하거나 UI로 표시)
        // 하지만 가이드에서는 안내를 권장하므로, UI에서 처리하도록 1개만 리턴
        return [closest]; 
      }
      return withinRadius;
    }
    return result; // 초기 검색 전에는 전체(클러스터용) 혹은 필터된 전체 반환
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

      {sdkError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-100/90 backdrop-blur-md">
          <p className="text-slate-700 font-bold mb-2">지도를 불러오지 못했습니다.</p>
          <p className="text-sm text-slate-500 mb-4">새로고침 하거나 잠시 후 다시 시도해주세요.</p>
        </div>
      )}

      {!sdkError && !loaded && status === 'ready' && (
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-slate-100">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-500 rounded-full animate-spin mb-2"></div>
          <p className="text-slate-500 text-sm font-medium">지도 로딩 중...</p>
        </div>
      )}

      {loaded && (
        <>
          <CenterMap 
            centers={nearbyCenters}
            searchOrigin={searchOrigin}
            radiusKm={radiusKm}
            selectedCenterId={selectedCenterId}
            onSelectCenter={setSelectedCenterId}
          />
          <CenterSearchPanel
            allCenters={data.centers}
            filteredCenters={nearbyCenters}
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
