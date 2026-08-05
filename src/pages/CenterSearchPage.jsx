import React from 'react';
import { Map, Info } from 'lucide-react';

export default function CenterSearchPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 flex-1 w-full flex flex-col">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm">
              <Map className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">치매 센터 찾기</h1>
          </div>
          <p className="text-slate-500 font-medium">
            지역을 검색하여 인근의 치매 안심 센터와 관련 기관을 찾아보세요. (Neo4j 및 지도 연동 예정)
          </p>
        </div>

        <div className="bg-white rounded-3xl p-10 flex-1 shadow-sm border border-slate-100 flex items-center justify-center text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Info className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-700">준비 중인 페이지입니다</h2>
            <p className="text-slate-400">
              추후 지도 서비스 및 데이터베이스와 연동하여<br />맞춤형 센터 정보를 제공할 예정입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
