import React, { useState, useMemo, useEffect } from 'react';
import { Search, Locate, Map, X } from 'lucide-react';
import CenterListItem from './CenterListItem';

export default function CenterSearchPanel({
  allCenters,
  filteredCenters,
  isRadiusFallback,
  searchOrigin,
  radiusKm,
  activeTags,
  tagLabels,
  onSearchAddress,
  onSearchCurrentLocation,
  onSearchRegion,
  onClearSearch,
  onChangeRadius,
  onToggleTag,
  selectedCenterId,
  onSelectCenter
}) {
  // 시도 목록 및 선택 상태
  const sidos = useMemo(() => {
    if (!allCenters) return [];
    return [...new Set(allCenters.map(c => c.sido).filter(Boolean))].sort();
  }, [allCenters]);
  
  const [selectedSido, setSelectedSido] = useState('');
  const [selectedSigungu, setSelectedSigungu] = useState('');

  // 시군구 목록
  const sigungus = useMemo(() => {
    if (!allCenters || !selectedSido) return [];
    return [...new Set(
      allCenters.filter(c => c.sido === selectedSido).map(c => c.sigungu).filter(Boolean)
    )].sort();
  }, [allCenters, selectedSido]);

  useEffect(() => {
    if (selectedSido && selectedSigungu) {
      onSearchRegion(selectedSido, selectedSigungu);
    }
  }, [selectedSido, selectedSigungu, onSearchRegion]);

  const handleOpenPostcode = () => {
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function(data) {
          const addr = data.roadAddress || data.jibunAddress;
          onSearchAddress(addr);
        }
      }).open();
    } else {
      alert("우편번호 서비스를 불러올 수 없습니다. 아래 드롭다운으로 지역을 선택해 주세요.");
    }
  };

  return (
    <div className="absolute top-0 md:top-6 left-0 md:left-6 w-full md:w-[380px] h-[45%] md:h-[calc(100%-3rem)] flex flex-col z-20 transition-all">
      <div className="glass-panel flex-1 rounded-none md:rounded-3xl shadow-lg border border-white/40 overflow-hidden flex flex-col bg-white/85 backdrop-blur-xl">
        
        {/* 상단 검색 폼 */}
        <div className="p-5 border-b border-slate-200/50 shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-sm">
              <Map className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight flex-1">치매 센터 찾기</h2>
            {searchOrigin && (
              <button
                onClick={() => {
                  setSelectedSido('');
                  setSelectedSigungu('');
                  if (onClearSearch) onClearSearch();
                }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
                title="지역 검색 해제"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <button
            onClick={handleOpenPostcode}
            className="w-full flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm font-bold shadow-sm mb-2"
          >
            <Search className="w-4 h-4 text-blue-500" />
            주소 검색
          </button>
          
          <button
            onClick={onSearchCurrentLocation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 border border-transparent rounded-xl text-slate-600 hover:bg-slate-200 transition-colors text-sm font-bold mb-4"
          >
            <Locate className="w-4 h-4" />
            현재 위치로 찾기
          </button>

          <div className="flex gap-2 mb-4">
            <select
              value={selectedSido}
              onChange={(e) => {
                setSelectedSido(e.target.value);
                setSelectedSigungu('');
              }}
              className="flex-1 text-sm border-slate-200 rounded-lg py-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">시/도 선택</option>
              {sidos.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={selectedSigungu}
              onChange={(e) => setSelectedSigungu(e.target.value)}
              disabled={!selectedSido}
              className="flex-1 text-sm border-slate-200 rounded-lg py-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">시/군/구 선택</option>
              {sigungus.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">반경 (km)</span>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                {[5, 10, 20].map(r => (
                  <button
                    key={r}
                    onClick={() => onChangeRadius(r)}
                    className={`flex items-center justify-center px-3 text-xs font-bold rounded-md min-w-[44px] min-h-[44px] transition-colors ${
                      radiusKm === r ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-sm font-bold text-slate-700 block mb-2">검색 결과</span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(tagLabels || {}).map(([tagKey, label]) => {
                  const isActive = activeTags.has(tagKey);
                  return (
                    <button
                      key={tagKey}
                      onClick={() => onToggleTag(tagKey)}
                      className={`flex items-center justify-center px-3 text-[11px] font-bold rounded-full border transition-colors min-h-[44px] ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 결과 리스트 */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
          {!searchOrigin ? (
            <div className="text-center py-10 text-slate-400">
              <Map className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium text-sm">주소를 검색하시거나 지역을 선택하여<br/>가까운 센터를 확인해보세요.</p>
            </div>
          ) : filteredCenters.length > 0 ? (
            <>
              {isRadiusFallback ? (
                <div className="mb-3 px-3.5 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-bold text-amber-800 leading-relaxed">
                  반경 {radiusKm}km 내에는 센터가 없어, 가장 가까운 센터를 보여드립니다.
                </div>
              ) : (
                <div className="text-sm font-bold text-slate-600 mb-3 pl-1">
                  결과 <span className="text-blue-600">{filteredCenters.length}</span>곳
                </div>
              )}
              {filteredCenters.map(center => (
                <CenterListItem
                  key={center.id}
                  center={center}
                  isSelected={selectedCenterId === center.id}
                  onSelect={onSelectCenter}
                />
              ))}
            </>
          ) : (
            <div className="text-center py-10 text-slate-500 font-medium text-sm px-4 bg-white rounded-xl border border-dashed border-slate-200">
              반경 {radiusKm}km 내에 조건에 맞는 센터가 없습니다.<br />필터를 해제하거나 반경을 넓혀보세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
