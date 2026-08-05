import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import CenterDetailOverlay from './CenterDetailOverlay';

export default function CenterMap({ 
  centers, 
  searchOrigin, 
  radiusKm, 
  selectedCenterId, 
  onSelectCenter 
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const clustererRef = useRef(null);
  const markersRef = useRef(new Map());
  const overlayRef = useRef(null);
  const overlayRootRef = useRef(null);
  const circleRef = useRef(null);
  const originMarkerRef = useRef(null);

  // 1. 지도 초기화
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) return;

    if (!mapRef.current) {
      const options = {
        center: new kakao.maps.LatLng(36.5, 127.8), // 초기 중심: 대한민국 중앙
        level: 13,
      };
      
      const map = new kakao.maps.Map(mapContainerRef.current, options);
      mapRef.current = map;

      const clusterer = new kakao.maps.MarkerClusterer({
        map: map, 
        averageCenter: true, 
        minLevel: 8, 
        gridSize: 60,
        styles: [{
          width: '50px',
          height: '46px',
          background: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 50 46\'%3e%3cdefs%3e%3clinearGradient id=\'g\' x1=\'0\' y1=\'0\' x2=\'0\' y2=\'1\'%3e%3cstop offset=\'0%25\' stop-color=\'%23ffffff\'/%3e%3cstop offset=\'100%25\' stop-color=\'%23f1f5f9\'/%3e%3c/linearGradient%3e%3cfilter id=\'s\'%3e%3cfeDropShadow dx=\'0\' dy=\'1\' stdDeviation=\'1.5\' flood-opacity=\'0.2\'/%3e%3c/filter%3e%3c/defs%3e%3cpath d=\'M7 3C4.2 3 2 5.2 2 8v18c0 2.8 2.2 5 5 5h13l5 7 5-7h13c2.8 0 5-2.2 5-5V8c0-2.8-2.2-5-5-5H7z\' fill=\'url(%23g)\' stroke=\'%232563eb\' stroke-width=\'1.5\' filter=\'url(%23s)\'/%3e%3c/svg%3e") no-repeat center',
          color: '#2563eb',
          textAlign: 'center',
          lineHeight: '40px',
          fontSize: '14px',
          fontWeight: 'bold'
        }]
      });
      clustererRef.current = clusterer;

      // 오버레이 컨테이너 초기화
      const overlayContent = document.createElement('div');
      overlayContent.style.cssText = 'position: absolute; bottom: 40px; left: -170px;';
      overlayRootRef.current = createRoot(overlayContent);
      
      const overlay = new kakao.maps.CustomOverlay({
        content: overlayContent,
        map: null,
        clickable: true,
        zIndex: 10,
      });
      overlayRef.current = overlay;
    }

    // cleanup
    return () => {
      // 맵 언마운트 시 처리 (HMR 대응 및 누수 방지)
      if (overlayRootRef.current) {
        // HMR 시 바로 unmount하면 에러날 수 있음 
        setTimeout(() => overlayRootRef.current?.unmount(), 0);
        overlayRootRef.current = null;
      }
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
      if (originMarkerRef.current) {
        originMarkerRef.current.setMap(null);
        originMarkerRef.current = null;
      }
      if (clustererRef.current) {
        clustererRef.current.clear();
        clustererRef.current = null;
      }
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current.clear();
      
      mapRef.current = null;
    };
  }, []);

  // 2. 검색 중심(searchOrigin) 반영
  useEffect(() => {
    if (!mapRef.current || !window.kakao) return;
    const map = mapRef.current;

    if (searchOrigin) {
      const originPosition = new kakao.maps.LatLng(searchOrigin.lat, searchOrigin.lng);
      map.setCenter(originPosition);
      map.setLevel(radiusKm === 20 ? 8 : radiusKm === 10 ? 7 : 6);

      // 검색 마커
      if (!originMarkerRef.current) {
        originMarkerRef.current = new kakao.maps.Marker({
          position: originPosition,
          map: map,
          // 기본 마커 외에 다른 색 등 지정 가능
        });
      } else {
        originMarkerRef.current.setPosition(originPosition);
        originMarkerRef.current.setMap(map);
      }

      // 반경 원
      if (!circleRef.current) {
        circleRef.current = new kakao.maps.Circle({
          center: originPosition,
          radius: radiusKm * 1000,
          strokeWeight: 1,
          strokeColor: '#3b82f6',
          strokeOpacity: 0.8,
          fillColor: '#93c5fd',
          fillOpacity: 0.2,
          map: map
        });
      } else {
        circleRef.current.setPosition(originPosition);
        circleRef.current.setRadius(radiusKm * 1000);
        circleRef.current.setMap(map);
      }
    } else {
      // searchOrigin 없음 (초기화)
      if (originMarkerRef.current) originMarkerRef.current.setMap(null);
      if (circleRef.current) circleRef.current.setMap(null);
    }
  }, [searchOrigin, radiusKm]);

  // 3. 센터 목록 렌더링 및 클러스터 반영
  useEffect(() => {
    if (!mapRef.current || !clustererRef.current || !window.kakao) return;

    // 기존 마커 전체 맵에서 제거 및 클러스터 초기화
    clustererRef.current.clear();
    markersRef.current.forEach(marker => marker.setMap(null));
    
    // 재사용할 마커 객체가 있다면 재사용하고, 없으면 새로 생성
    const newMarkersMap = new Map();
    const markersToCluster = [];

    centers.forEach(center => {
      let marker = markersRef.current.get(center.id);
      if (!marker) {
        const position = new kakao.maps.LatLng(center.lat, center.lng);
        // TODO: 조건부 마커 이미지 (광역치매센터, 예방프로그램 유무 등)
        marker = new kakao.maps.Marker({
          position,
          title: center.name
        });
        
        kakao.maps.event.addListener(marker, 'click', () => {
          onSelectCenter(center.id);
        });
      }
      
      newMarkersMap.set(center.id, marker);
      markersToCluster.push(marker);
    });

    markersRef.current = newMarkersMap;

    // searchOrigin이 있을 때(소수)는 클러스터를 끄고 개별 마커로 표시
    if (searchOrigin) {
      markersToCluster.forEach(m => m.setMap(mapRef.current));
    } else {
      clustererRef.current.addMarkers(markersToCluster);
    }

  }, [centers, searchOrigin, onSelectCenter]);

  // 4. 선택된 센터 오버레이 처리
  useEffect(() => {
    if (!mapRef.current || !overlayRef.current || !overlayRootRef.current || !window.kakao) return;

    if (selectedCenterId) {
      const center = centers.find(c => c.id === selectedCenterId);
      if (center) {
        const position = new kakao.maps.LatLng(center.lat, center.lng);
        
        // 오버레이 컨텐츠 렌더링
        overlayRootRef.current.render(
          <CenterDetailOverlay 
            center={center} 
            onClose={() => onSelectCenter(null)} 
          />
        );

        overlayRef.current.setPosition(position);
        overlayRef.current.setMap(mapRef.current);
        
        // 해당 위치로 이동
        mapRef.current.panTo(position);
      }
    } else {
      overlayRef.current.setMap(null);
    }
  }, [selectedCenterId, centers, onSelectCenter]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-[calc(100vh-5rem)] bg-slate-100 relative z-0"
      aria-label="치매 안심 센터 지도"
    >
      {/* Fallback content for screen readers or while loading */}
    </div>
  );
}
