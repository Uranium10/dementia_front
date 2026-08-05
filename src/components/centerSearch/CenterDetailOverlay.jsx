import React from 'react';
import { X, Phone, ExternalLink, Navigation, MapPin } from 'lucide-react';

/**
 * 카카오맵 CustomOverlay 내부를 채울 React 컴포넌트
 * (CenterMap.jsx에서 ReactDOM.createRoot로 DOM 요소 안에 렌더링합니다)
 */
export default function CenterDetailOverlay({ center, onClose }) {
  const hasPrograms = center.programs && center.programs.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-[340px] overflow-hidden flex flex-col font-sans">
      <div className="p-5 pb-4 relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-3 top-3 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pr-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-bold rounded">
              {center.type}
            </span>
            {center.distanceKm !== undefined && (
              <span className="text-sm font-bold text-slate-500">
                {center.distanceKm.toFixed(1)}km
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-800 leading-tight mb-2">
            {center.name}
          </h3>
          <p className="text-sm text-slate-500 mb-1 flex items-start gap-1">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{center.addr}</span>
          </p>
          <p className="text-sm text-slate-500 font-medium ml-5 mb-4">
            {center.tel}
          </p>
          
          <div className="flex flex-wrap gap-1.5 mb-2">
            {hasPrograms ? (
              <>
                {center.programs.map((p, idx) => (
                  <span key={idx} className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-md whitespace-nowrap">
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
        </div>
      </div>

      <div className="flex border-t border-slate-100 bg-slate-50">
        <a
          href={`tel:${center.tel}`}
          className="flex-1 py-3 flex justify-center items-center gap-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors border-r border-slate-100"
        >
          <Phone className="w-4 h-4 text-slate-400" />
          전화
        </a>
        {center.homepage && (
          <a
            href={center.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 flex justify-center items-center gap-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors border-r border-slate-100"
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
            웹사이트
          </a>
        )}
        <a
          href={`https://map.kakao.com/link/to/${encodeURIComponent(center.name)},${center.lat},${center.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-3 flex justify-center items-center gap-1.5 text-sm font-bold text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
        >
          <Navigation className="w-4 h-4" />
          길찾기
        </a>
      </div>
    </div>
  );
}
