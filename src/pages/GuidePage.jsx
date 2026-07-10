import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, ArrowLeft, BookOpen, ShieldCheck, MapPin } from 'lucide-react';

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">


      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-10 space-y-12">
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-800">1. AI 치매 상담 및 진단</h2>
          </div>
          <p className="text-slate-600 leading-relaxed mb-4">
            치매정보알리미의 AI 상담 챗봇은 보호자님께서 어르신의 증상을 편하게 말씀하실 수 있도록 설계되었습니다. 
            단순히 증상만 듣는 것이 아니라, 증상에 따라 어떤 대처가 필요한지, 어떤 검사를 받아야 하는지 객관식 문항을 통해 구체적으로 안내해 드립니다.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600">
            <li>메인 화면에서 <strong>'치매 상담 및 진단'</strong> 패널을 클릭하세요.</li>
            <li>하단 입력창에 어르신의 연령과 최근 걱정되는 증상을 입력하세요.</li>
            <li>AI가 제공하는 선택지를 클릭하며 단계별로 정밀한 안내를 받으실 수 있습니다.</li>
          </ul>
        </section>

        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-800">2. 치매안심센터 연계 (예정)</h2>
          </div>
          <p className="text-slate-600 leading-relaxed">
            상담을 마친 후, 거주하시는 지역(예: 강남구, 분당구 등)을 입력하시면 가장 가까운 국가 지정 치매안심센터의 위치, 연락처, 그리고 예약 가능한 프로그램 정보를 안내해 드립니다. 
            (현재 이 기능은 Graph DB 구축 후 오픈될 예정입니다.)
          </p>
        </section>

        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-8 h-8 text-slate-400" />
            <h2 className="text-2xl font-bold text-slate-400">3. 인지 능력 예방 가이드 (준비 중)</h2>
          </div>
          <p className="text-slate-500 leading-relaxed mb-4">
            치매는 진단만큼이나 예방이 중요합니다. 다음 업데이트를 통해 일상에서 실천할 수 있는 두뇌 인지 훈련 퍼즐, 운동 영상, 건강 식단 가이드가 추가될 예정입니다.
          </p>
          <div className="bg-slate-100 text-slate-500 px-4 py-2 rounded-lg inline-block font-semibold text-sm">
            다음 프로젝트 범위에서 오픈됩니다
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center text-xs text-slate-400">
          © 2026 치매정보알리미. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
