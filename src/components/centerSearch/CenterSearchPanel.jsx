import React, { useState, useMemo, useEffect } from 'react';
import { Search, Locate, Map, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
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
  const [isPanelOpen, setIsPanelOpen] = useState(true);

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
    <>
      <div 
        className={`absolute w-full md:w-[380px] flex flex-col z-20 transition-all duration-300 ease-in-out
          bottom-0 md:bottom-auto md:top-6 
          h-[45%] md:h-[calc(100%-3rem)]
          ${isPanelOpen ? 'translate-y-0 md:translate-y-0 md:left-6' : 'translate-y-[calc(100%-40px)] md:translate-y-0 md:-left-[380px]'}
        `}
      >
        <div className="glass-panel flex-1 rounded-t-3xl md:rounded-3xl shadow-lg border border-white/40 overflow-hidden flex flex-col bg-white/85 backdrop-blur-xl relative">
          
          {/* 모바일용 상단 토글 핸들 (40px만 노출) */}
          <button 
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="md:hidden w-full h-[40px] flex items-center justify-center shrink-0 bg-slate-50/80 border-b border-slate-200/50"
            aria-label={isPanelOpen ? '패널 내리기' : '패널 올리기'}
          >
            {isPanelOpen ? <ChevronDown className="text-slate-400" /> : <ChevronUp className="text-slate-400" />}
            <span className="text-xs font-bold text-slate-500 ml-1">검색 패널</span>
          </button>
        
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
                className="text-slate-500 bg-slate-100 hover:text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold text-sm transition-colors flex items-center gap-1"
                title="지역 검색 취소"
              >
                <X className="w-4 h-4" />
                검색 취소
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
              <span className="text-sm font-bold text-slate-700 block mb-2">프로그램 필터</span>
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
          <div className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-blue-500 rounded-full inline-block"></span>
            검색 결과
          </div>
          
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
                <div className="text-sm font-bold text-slate-600 mb-3 pl-2">
                  <span className="text-blue-600">{filteredCenters.length}</span>곳
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
      
      {/* 데스크톱용 우측 토글 버튼 */}
      <button 
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className={`hidden md:flex absolute top-1/2 -translate-y-1/2 w-8 h-16 bg-white/85 backdrop-blur-xl border border-white/40 border-l-0 rounded-r-xl shadow-lg items-center justify-center text-slate-500 hover:text-blue-600 transition-all duration-300 z-10 ${
          isPanelOpen ? 'left-full' : '-right-8'
        }`}
        aria-label={isPanelOpen ? '검색 패널 숨기기' : '검색 패널 나타내기'}
      >
        {isPanelOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
    </div>
    </>
  );
}
