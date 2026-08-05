/**
 * 두 위경도 좌표 간의 거리를 킬로미터(km) 단위로 반환합니다.
 * Haversine 공식을 사용합니다.
 * @param {number} lat1 시작점 위도
 * @param {number} lng1 시작점 경도
 * @param {number} lat2 도착점 위도
 * @param {number} lng2 도착점 경도
 * @returns {number} 거리 (km)
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  if (lat1 === lat2 && lng1 === lng2) return 0;
  
  const R = 6371; // 지구 반지름 (km)
  
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}
