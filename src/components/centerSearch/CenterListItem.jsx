import React, { useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';

export default function CenterListItem({ center, isSelected, onSelect }) {
  const itemRef = useRef(null);

  // 선택 상태가 되면 자기 자신으로 부드럽게 스크롤
  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected]);

  const hasPrograms = center.programs && center.programs.length > 0;

  return (
    <button
      ref={itemRef}
      onClick={() => {
        onSelect(center);
        if (center.homepage) {
          window.open(center.homepage, '_blank', 'noopener,noreferrer');
        }
      }}
      aria-label={`${center.name} 센터 정보`}
      className={`group w-full text-left p-5 rounded-2xl transition-all border block mb-3 min-h-[88px] ${
        isSelected
          ? 'bg-blue-50 border-blue-200 shadow-md ring-2 ring-blue-600/20'
          : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 hover:bg-slate-50'
      }`}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <h3 className="text-[17px] font-bold text-blue-600 group-hover:underline leading-tight flex-1">
          {center.name}
        </h3>
        {center.distanceKm !== undefined && (
          <span className="text-sm font-bold text-blue-600 shrink-0 bg-blue-100/50 px-2.5 py-1 rounded-lg flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {center.distanceKm.toFixed(1)}km
          </span>
        )}
      </div>

      <div className="text-sm text-slate-500 mb-3 font-medium">
        {center.addr}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {hasPrograms ? (
          <>
            {center.programs.map((p, idx) => (
              <span
                key={idx}
                className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-md whitespace-nowrap"
              >
                {p}
              </span>
            ))}
          </>
        ) : (
          <span className="inline-block px-2 py-1 bg-red-50 text-red-500 text-[11px] font-bold rounded-md">
            등록된 프로그램 정보가 없습니다
          </span>
        )}
      </div>
    </button>
  );
}
